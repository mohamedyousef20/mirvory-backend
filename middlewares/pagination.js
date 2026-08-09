/**
 * Global Pagination Middleware
 * Handles pagination parameters and adds pagination metadata to request
 * Default limit: 12 items per page
 */

export const paginate = (defaultLimit = 12) => {
  return (req, res, next) => {
    try {
      // Get page and limit from query params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || defaultLimit;

      // Validate page and limit
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

      // Calculate skip
      const skip = (validPage - 1) * validLimit;

      // Add pagination data to request
      req.pagination = {
        page: validPage,
        limit: validLimit,
        skip,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to format pagination response
 */
export const formatPaginationResponse = (data, total, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
};
