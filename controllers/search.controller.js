import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import SearchHistory from '../models/searchHistory.model.js';
import mongoose from 'mongoose';
import createError from '../utils/error.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Advanced Search Controller
 * Uses MongoDB text search with relevance scoring
 */
export const searchProducts = async (req, res, next) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sort = 'latest',
      availability
    } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    // 1. بناء الفلتر الأساسي للمنتجات المتاحة والمقبولة
    const filter = {
      isApproved: true,
      status: 'available'
    };

    // إضافة فلتر القسم
    if (category && isValidObjectId(category)) {
      filter.category = category;
    }

    // إضافة فلتر نطاق الأسعار
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // 2. تطبيق التطابق الجزئي (Partial Matching) عند وجود نص بحث
    if (query && query.trim()) {
      // هروب الرموز الخاصة (Escape Regex Characters) لحماية السيرفر من هجمات Regex Injection
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // إنشاء الفلتر النمطي للتطابق الجزئي وغير الحساس لحالة الأحرف
      const regexFilter = { $regex: safeQuery, $options: 'i' };

      // البحث الجزئي في العنوان، الوصف، البراند، أو الأوسم الدلالية
      filter.$or = [
        { title: regexFilter },
        { description: regexFilter },
        { brand: regexFilter },
        { tags: regexFilter }
      ];
    }

    // 3. جلب العدد الإجمالي للمنتجات المطابقة للفلتر الجديد
    const total = await Product.countDocuments(filter);

    // 4. تحديد خيارات الترتيب (تم إلغاء الترتيب بناءً على الـ textScore لأنه لا يعمل مع regex)
    let sortOption = { createdAt: -1 }; // الافتراضي: الأحدث أولاً
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'top_rated') sortOption = { 'ratings.average': -1 };
    else if (sort === 'popular') sortOption = { sold: -1 };

    // 5. تنفيذ استعلام جلب البيانات
    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName')
      .populate('category', 'name nameEn')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 6. حفظ عملية البحث في سجل المستخدم (Search History)
    if (query && query.trim() && req.user) {
      await SearchHistory.findOneAndUpdate(
        { user: req.user._id, query: query.trim().toLowerCase() },
        {
          $inc: { searchCount: 1 },
          $set: { lastSearchedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Search Suggestions / Autocomplete
 * Returns product titles and categories matching the query
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const normalizedQuery = query.trim().replace(/[^\w\s\u0600-\u06FF-]/g, ' ').replace(/\s+/g, ' ');

    // Get product title suggestions
    const productSuggestions = await Product.find({
      $text: { $search: normalizedQuery },
      isApproved: true,
      status: 'available'
    })
      .select('title _id')
      .limit(8)
      .lean();

    // Get category suggestions (if category model exists)
    let categorySuggestions = [];
    try {
      const Category = mongoose.model('Category');
      categorySuggestions = await Category.find({
        $or: [
          { name: { $regex: normalizedQuery, $options: 'i' } },
          { nameEn: { $regex: normalizedQuery, $options: 'i' } }
        ]
      })
        .select('name nameEn _id')
        .limit(4)
        .lean();
    } catch (err) {
      // Category model might not exist
    }

    const suggestions = [
      ...productSuggestions.map(p => ({
        type: 'product',
        id: p._id,
        title: p.title,
        url: `/products/${p._id}`
      })),
      ...categorySuggestions.map(c => ({
        type: 'category',
        id: c._id,
        title: c.name || c.nameEn,
        url: `/products?category=${c._id}`
      }))
    ];

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recent Searches for a user
 */
export const getRecentSearches = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true, recentSearches: [] });
    }

    const recentSearches = await SearchHistory.find({ user: req.user._id })
      .sort({ lastSearchedAt: -1 })
      .limit(10)
      .select('query searchCount lastSearchedAt')
      .lean();

    res.status(200).json({ success: true, recentSearches });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Trending Searches (most searched queries globally)
 */
export const getTrendingSearches = async (req, res, next) => {
  try {
    const trendingSearches = await SearchHistory.aggregate([
      {
        $group: {
          _id: '$query',
          totalSearches: { $sum: '$searchCount' },
          lastSearchedAt: { $max: '$lastSearchedAt' }
        }
      },
      {
        $sort: { totalSearches: -1, lastSearchedAt: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          query: '$_id',
          totalSearches: 1,
          lastSearchedAt: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({ success: true, trendingSearches });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear Search History for a user
 */
export const clearSearchHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      throw createError('Unauthorized', 401);
    }

    await SearchHistory.deleteMany({ user: req.user._id });

    res.status(200).json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};
