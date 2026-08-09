import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { createNotifications } from '../utils/notification.js';
import createError from '../utils/error.js';
import { formatPaginationResponse } from '../middlewares/pagination.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 📦 PRODUCT CRUD & MANAGEMENT
// ==========================================
export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body.data || req.body;

    if (!productData.title || !productData.description || !productData.price || !productData.category) {
      throw new createError("جميع الحقول الأساسية (الاسم، الوصف، السعر، القسم) مطلوبة", 400);
    }
    if (!isValidObjectId(productData.category)) throw new createError("القسم المحدد غير صالح", 400);

    if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
      throw new createError("يجب إرفاق صورة واحدة على الأقل للمنتج", 400);
    }

    let sizes = [];
    if (productData.sizes) {
      try {
        sizes = typeof productData.sizes === 'string' ? JSON.parse(productData.sizes) : productData.sizes;
        if (!Array.isArray(sizes)) sizes = [sizes];
      } catch (e) { sizes = [productData.sizes]; }
    }

    let colors = [];
    if (productData.colors) {
      try {
        colors = typeof productData.colors === 'string' ? JSON.parse(productData.colors) : productData.colors;
        if (!Array.isArray(colors)) colors = [colors];
      } catch (e) { colors = [productData.colors]; }

      if (colors.length > 0) {
        const isValidColors = colors.every(c => c && typeof c === 'object' && c.name && c.value);
        if (!isValidColors) throw new createError("صيغة الألوان غير صحيحة", 400);
        colors = colors.map(c => ({ name: c.name, value: c.value, available: c.available !== false }));
      }
    }

    const price = parseFloat(productData.price);
    const discountPercentage = parseFloat(productData.discountPercentage) || 0;
    const discountAmount = price * (discountPercentage / 100);
    const discountedPrice = price - discountAmount;

    let multiplier = 0.90;
    if (!discountedPrice || discountedPrice <= 0) {
      multiplier = 0.90;
    } else if (discountedPrice < 300) {
      multiplier = 0.82;
    } else if (discountedPrice >= 300 && discountedPrice <= 799) {
      multiplier = 0.85;
    } else if (discountedPrice >= 800 && discountedPrice <= 1999) {
      multiplier = 0.88;
    }

    const sellerPercentage = discountedPrice * multiplier;

    const product = await Product.create({
      seller: req.user._id,
      title: productData.title,
      description: productData.description,
      images: productData.images,
      sizes,
      colors,
      price,
      discountPercentage,
      discountedPrice,
      category: productData.category,
      status: 'pending',
      isApproved: false,
      sellerPercentage,
      isFeatured: productData.isFeatured === 'true' || productData.isFeatured === true,
      quantity: parseInt(productData.quantity) || 0
    });

    await product.populate('category', 'name nameEn');
    await product.populate('seller', 'firstName lastName email');

    // 🔔 NOTIFICATION: Product Submitted for Review
    (async () => {
      try {
        const io = req.app.get("io");
        const admin = await User.findOne({ role: 'admin' }).select('_id');

          await createNotifications({
            io, title: '📦 منتج جديد للمراجعة',
            message: `تم إضافة منتج جديد "${product.title}" بواسطة ${product.seller.firstName}`,
            type: 'PRODUCT_SUBMITTED',
            actor: req.user._id,
            userId: admin._id.toString(),
            data: { productId: product._id }, link: `/products/${product._id}`,
          });
        
      } catch (err) { console.error("Notification Error:", err); }
    })();

    res.status(201).json({ success: true, message: 'تم إضافة المنتج وهو قيد المراجعة', product });
  } catch (error) {
    if (error.code === 11000) return next(new createError("يوجد منتج مشابه بالفعل", 400));
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id, ...updates } = req.body;
    if (!isValidObjectId(id)) throw new createError("معرف المنتج غير صالح", 400);

    const product = await Product.findById(id);

    if (!product) throw new createError("المنتج غير موجود", 404);

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new createError("غير مصرح لك بتحديث هذا المنتج", 403);
    }

    if (updates.images && Array.isArray(updates.images)) product.images = updates.images;

    if (updates.sizes !== undefined) {
      try {
        product.sizes = typeof updates.sizes === 'string' ? JSON.parse(updates.sizes) : (Array.isArray(updates.sizes) ? updates.sizes : [updates.sizes]);
      } catch (e) { product.sizes = updates.sizes; }
    }

    if (updates.price !== undefined || updates.discountPercentage !== undefined) {
      const price = updates.price !== undefined ? parseFloat(updates.price) : product.price;
      const discountPercentage = updates.discountPercentage !== undefined ? parseFloat(updates.discountPercentage) : product.discountPercentage;
      product.price = price;
      product.discountPercentage = discountPercentage;
      product.discountedPrice = price - (price * (discountPercentage / 100));
    }

    const allowedUpdates = ['title', 'description', 'quantity', 'category', 'isFeatured', 'sellerPercentage'];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'quantity' || key === 'sellerPercentage') product[key] = parseFloat(updates[key]);
        else if (key === 'isFeatured') product[key] = (updates[key] === 'true' || updates[key] === true);
        else product[key] = updates[key];
      }
    });

    const requiresReapproval = req.user.role !== 'admin';
    if (requiresReapproval) {
      product.isApproved = false;
      product.status = 'pending';
    }

    const updatedProduct = await product.save();
    await updatedProduct.populate('category', 'name nameEn');
    await updatedProduct.populate('seller', 'firstName lastName email');

    // 🔔 NOTIFICATION: Product Updated Pending Review
    if (requiresReapproval) {
      (async () => {
        try {
          const io = req.app.get("io");
          const admin = await User.findOne({ role: 'admin' }).select('_id');
            await createNotifications({
              io, title: '📦 تحديث منتج للمراجعة',
              message: `تم تعديل منتج "${updatedProduct.title}" ويحتاج إلى مراجعة جديدة`,
              type: 'PRODUCT_UPDATED', actor: req.user._id,
              userId: admin._id.toString(),
              data: { productId: updatedProduct._id }, link: `/admin/products/${updatedProduct._id}`,
            });
          
        } catch (err) { console.error(err); }
      })();
    }

    res.status(200).json({ success: true, message: 'تم تحديث المنتج بنجاح', product: updatedProduct });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!isValidObjectId(id)) throw new createError("معرف المنتج غير صالح", 400);

    const product = await Product.findById(id);
    if (!product) throw new createError("المنتج غير موجود", 404);

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new createError("غير مصرح لك بحذف هذا المنتج", 403);
    }

    // 🚨 الحل المعماري الصارم: الحذف المنطقي Soft Delete لحماية استقرار قواعد البيانات المالية
    product.status = 'deleted';
    product.isApproved = false;
    await product.save();

    res.status(200).json({ success: true, message: 'تم إيقاف وحذف المنتج منطقياً لضمان سلامة الفواتير المرتبطة' });
  } catch (error) { next(error); }
};

// ==========================================
// 🛡 ADMIN APPROVALS
// ==========================================
export const approveProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw new createError("مرفوض. للإدارة فقط.", 403);

    const id = req.params.id || req.body.id;
    if (!isValidObjectId(id)) throw new createError("معرف المنتج غير صالح", 400);

    const product = await Product.findByIdAndUpdate(
      id, { isApproved: true, status: "available", reason: null }, { new: true }
    ).populate("category", "name nameEn").populate("seller", "_id firstName lastName");

    if (!product) throw new createError("المنتج غير موجود", 404);

    (async () => {
      try {
        // ⚠️ تأكد من جلب الـ io في أول الدالة
        const io = req.app.get("io");

        // عدل استدعاء الدالة المساعدة ليكون هكذا:
        await createNotifications({
          io,
          title: "تم قبول منتجك",
          message: `تمت الموافقة على المنتج "${product.title}" وهو معروض الآن للبيع.`,
          type: "PRODUCT_APPROVED",
          actor: req.user._id,             // المعرف بتاع الإدمن اللي وافق
          userId: product.seller._id.toString(),
          data: { productId: product._id },
          link: `/vendor/dashbord`         // الرابط اللي التاجر هيروح عليه لما يضغط
        });
      } catch (err) { console.error(err); }
    })();

    res.status(200).json({ success: true, message: "تمت الموافقة على المنتج بنجاح", product });
  } catch (error) { next(error); }
};



export const rejectProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw new createError("مرفوض. للإدارة فقط.", 403);

    const { id, reason } = req.body;
    if (!isValidObjectId(id)) throw new createError("معرف المنتج غير صالح", 400);
    if (!reason || reason.trim() === '') throw new createError("يجب توضيح سبب الرفض", 400);

    const product = await Product.findByIdAndUpdate(
      id, { isApproved: false, status: "rejected", reason: reason.trim() }, { new: true }
    ).populate("category", "name nameEn").populate("seller", "_id firstName lastName");

    if (!product) throw new createError("المنتج غير موجود", 404);

    (async () => {
      try {
        const io = req.app.get("io");
        await createNotifications({
          io, title: "❌ تم رفض منتجك",
          message: `تم رفض منتج "${product.title}". السبب: ${reason}`,
          type: "PRODUCT_REJECTED", actor: req.user._id, userIds: [product.seller._id.toString()], // ✅ تم التعديل
          data: { productId: product._id, reason }, link: `/seller/products/${product._id}`,
        });
      } catch (err) { console.error(err); }
    })();

    res.status(200).json({ success: true, message: "تم رفض المنتج وإشعار البائع", product });
  } catch (error) { next(error); }
};

export const trustProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw new createError("مرفوض. للإدارة فقط.", 403);

    const id = req.params.id || req.body.id;
    if (!isValidObjectId(id)) throw new createError("معرف المنتج غير صالح", 400);

    const product = await Product.findByIdAndUpdate(
      id, { isTrusted: true }, { new: true }
    )

    if (!product) throw new createError("المنتج غير موجود", 404);

    (async () => {
      try {
        const io = req.app.get("io");
        await createNotifications({
          io, title: "✅ تم توثيق  منتجك",
          message: `تم توثيق منتجك "${product.title}" وهو معروض الآن للبيع.`,
          type: "PRODUCT_UPDATED", actor: req.user._id,
          userIds: product.seller._id.toString(), // ✅ تم التعديل
          data: { productId: product._id }, link: `/products/${product._id}`,
        });
      } catch (err) { console.error(err); }
    })();

    res.status(200).json({ success: true, message: "تمت التوثيق على المنتج بنجاح", product });
  } catch (error) { next(error); }
};
// ==========================================
// 🔍 GETTERS & LISTINGS (Optimized with .lean())
// ==========================================
export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};

    const filter = {
      isApproved: true,
      status: "available",
    };

    // Price Filter
    if (
      filterObj.minPrice !== undefined ||
      filterObj.maxPrice !== undefined
    ) {
      filter.price = {};

      if (filterObj.minPrice !== undefined) {
        filter.price.$gte = Number(filterObj.minPrice);
      }

      if (filterObj.maxPrice !== undefined) {
        filter.price.$lte = Number(filterObj.maxPrice);
      }
    }

    // Add remaining filters
    Object.keys(filterObj).forEach((key) => {
      if (key !== "minPrice" && key !== "maxPrice") {
        filter[key] = filterObj[key];
      }
    });

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select('title images sizes colors price discountedPrice discountPercentage ratings seller category status sold quantity')
        .populate('seller', 'firstName lastName')
        .populate('category', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json(formatPaginationResponse(products, total, req.pagination));
  } catch (error) { next(error); }
};

export const getProductsForAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw new createError("مرفوض", 403);
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};

    const filter = { ...filterObj };
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('seller', 'firstName lastName email')
        .populate('category', 'name nameEn')
        .sort(sortObj)
        .skip(skip).limit(limit).lean(),
    ]);

    res.status(200).json(formatPaginationResponse(products, total, req.pagination));
  } catch (error) { next(error); }
};

export const getSellerProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};

    const filter = { seller: req.user._id, status: { $ne: 'deleted' }, ...filterObj };
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('category', 'name nameEn')
        .sort(sortObj)
        .skip(skip).limit(limit).lean(),
    ]);

    res.status(200).json(formatPaginationResponse(products, total, req.pagination));
  } catch (error) { next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) throw new createError("معرف المنتج غير صالح", 400);

    const product = await Product.findById(productId)
      .populate('seller', 'firstName lastName email')
      .populate('category', '_id name nameEn description descriptionEn').lean();

    if (!product || product.status === 'deleted') throw new createError("المنتج غير موجود", 404);
    res.status(200).json({ success: true, product });
  } catch (error) { next(error); }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const filter = { isApproved: true, isFeatured: true, status: 'available' };
    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName')
      .populate('category', 'name nameEn')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(12)
      .lean();

    res.status(200).json({ success: true, data: products });
  } catch (error) { next(error); }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const filter = { isApproved: true, status: 'available' };
    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName')
      .populate('category', 'name nameEn')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    res.status(200).json({ success: true, data: products });
  } catch (error) { next(error); }
};

export const getProductsByCategory = async (req, res, next) => {
  try {
    console.log("getProductsByCategory called with params:", req.params);

    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      throw new createError("معرف القسم غير صالح", 400);
    }

    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};

    const filter = {
      isApproved: true,
      status: "available",
      category: categoryId,
    };

    // Price filter
    if (
      filterObj.minPrice !== undefined ||
      filterObj.maxPrice !== undefined
    ) {
      filter.price = {};

      if (filterObj.minPrice !== undefined) {
        filter.price.$gte = Number(filterObj.minPrice);
      }

      if (filterObj.maxPrice !== undefined) {
        filter.price.$lte = Number(filterObj.maxPrice);
      }
    }

    // Other filters
    Object.keys(filterObj).forEach((key) => {
      if (key !== "minPrice" && key !== "maxPrice") {
        filter[key] = filterObj[key];
      }
    });

    console.log("Filter constructed:", filter);

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),

      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    console.log("Total products:", total);
    console.log("Products:", products.length);

    res.status(200).json(
      formatPaginationResponse(
        products,
        total,
        req.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};