/**
 * Global Search Middleware
 * Handles search parameters and adds search filter to request
 * Supports multiple search fields and regex search
 */

export const search = (searchFields = []) => {
  return (req, res, next) => {
    try {
      const searchQuery = req.query.search || req.query.q;

      if (!searchQuery) {
        req.searchFilter = {};
        next();
        return;
      }

      // Build search filter
      const searchFilter = {
        $or: searchFields.map((field) => ({
          [field]: { $regex: searchQuery, $options: 'i' },
        })),
      };

      // Add search filter to request
      req.searchFilter = searchFilter;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to build filter object from query params
 */
export const buildFilter = (allowedFilters = {}) => {
  return (req, res, next) => {
    try {
      const filter = {};

      Object.keys(allowedFilters).forEach((key) => {
        const value = req.query[key];
        if (value !== undefined && value !== null && value !== '') {
          const filterType = allowedFilters[key];

          if (filterType === 'exact') {
            filter[key] = value;
          } else if (filterType === 'regex') {
            filter[key] = { $regex: value, $options: 'i' };
          } else if (filterType === 'array') {
            filter[key] = { $in: Array.isArray(value) ? value : [value] };
          } else if (filterType === 'number') {
            filter[key] = Number(value);
          } else if (filterType === 'boolean') {
            filter[key] = value === 'true' || value === true;
          } else if (filterType === 'date') {
            filter[key] = new Date(value);
          } else {
            filter[key] = value;
          }
        }
      });

      // Add filter to request
      req.filter = filter;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Common filter configurations for different models
 */
export const commonFilters = {
  product: {
    status: 'exact',
    category: 'exact',
    seller: 'exact',
    minPrice: 'number',
    maxPrice: 'number',
    isApproved: 'boolean',
    isFeatured: 'boolean',
  },
  user: {
    role: 'exact',
    isActive: 'boolean',
    isVerified: 'boolean',
    approvalStatus: 'exact',
  },
  order: {
    status: 'exact',
    paymentStatus: 'exact',
    deliveryStatus: 'exact',
    seller: 'exact',
    buyer: 'exact',
  },
  complaint: {
    status: 'exact',
    priority: 'exact',
    order: 'exact',
  },
};
