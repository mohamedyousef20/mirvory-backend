import express from 'express';
import {
  createProduct,
  getProducts,
  getProductsByCategory,
  getProductById,
  approveProduct,
  rejectProduct,
  getProductsForAdmin,
  getFeaturedProducts,
  getNewArrivals,
  getSellerProducts,
  deleteProduct,
  updateProduct,
  trustProduct
} from '../controllers/product.controller.js';
import {
  createRating,
  getProductRatings,
  getUserRating,
  updateRating,
  deleteRating
} from '../controllers/rating.controller.js';
import {
  searchProducts,
  getSearchSuggestions,
  getRecentSearches,
  getTrendingSearches,
  clearSearchHistory
} from '../controllers/search.controller.js';
import { isAdmin, isSeller, protect } from '../middlewares/auth.js';
import { paginate } from '../middlewares/pagination.js';
import { sort } from '../middlewares/sort.js';
import { buildFilter, commonFilters } from '../middlewares/search.js';


const router = express.Router({ mergeParams: true });

// مسارات المسؤول
router.get('/admin-products', protect, isAdmin, paginate(12), sort(), buildFilter(commonFilters.product),  getProductsForAdmin);
router.patch('/approve', protect, isAdmin, approveProduct);
router.patch('/reject', protect, isAdmin, rejectProduct);
router.patch('/trust', protect, isAdmin, trustProduct);

// مسارات البائع
router.get('/seller/products', protect, isSeller, paginate(12), sort(), buildFilter(commonFilters.product), getSellerProducts);
router.delete('/', protect, isSeller, deleteProduct);
router.patch('/', protect, isSeller, updateProduct);

// مسارات عامة
// Get all products in category
router.get('/category/:categoryId', paginate(12), sort(), buildFilter(commonFilters.product), getProductsByCategory);
// Advanced search endpoint
router.get('/search', searchProducts);
// Search suggestions/autocomplete
router.get('/search/suggestions', getSearchSuggestions);
// Get recent searches (requires auth)
router.get('/search/recent', protect, getRecentSearches);
// Get trending searches (public)
router.get('/search/trending', getTrendingSearches);
// Clear search history (requires auth)
router.delete('/search/history', protect, clearSearchHistory);

// Get all products in category
router.get('/', paginate(12), sort(), buildFilter(commonFilters.product), getProducts);
// Get Featured products in category
router.get('/featured/product', getFeaturedProducts);
// Get New Arrivals products in category
router.get('/new/product', getNewArrivals);

// Get specific product in category
router.get('/:productId', getProductById);
// Create product in category
router.post('/', protect, isSeller, createProduct);

// Rating routes
router.post('/:productId/ratings', protect, createRating);
router.get('/:productId/ratings', paginate(12), sort({ createdAt: -1 }), getProductRatings);
router.get('/:productId/ratings/user', protect, getUserRating);
router.patch('/:productId/ratings/:ratingId', protect, updateRating);
router.delete('/:productId/ratings/:ratingId', protect, deleteRating);

export default router;
