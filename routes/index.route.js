import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import guestOrderRoutes from './guestOrder.routes.js';
import guestCartRoutes from './guestCart.routes.js';
import notificationRoutes from './notification.routes.js';
import returnRoutes from './return.routes.js';
import pickupRoutes from './pickup.routes.js';
import cartRoutes from './cart.routes.js';
import categoryRoutes from './category.routes.js';
import announcementRoutes from './announcement.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import couponRoutes from './coupon.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import complaintRoutes from './complaint.routes.js';

const mountRoutes = (app) => {
    app.use('/api/products', productRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/carts', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/guest-orders', guestOrderRoutes);
    app.use('/api/guest-cart', guestCartRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/returns', returnRoutes);
    app.use('/api/pickup', pickupRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/coupons', couponRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/complaints', complaintRoutes);
};

export default mountRoutes;
