const { userSchemas } = require('../frontend/lib/validation/schema');

const validationService = {
  validateUser: async (type, data) => {
    try {
      const schema = userSchemas[type];
      if (!schema) {
        throw new Error(`No validation schema found for type: ${type}`);
      }

      const result = await schema.safeParseAsync(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(error => ({
          field: error.path[0],
          message: error.message
        }));
        
        throw {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors
        };
      }

      return result.data;
    } catch (error) {
      throw {
        status: 500,
        code: 'VALIDATION_ERROR',
        message: 'Internal validation error',
        error: error.message
      };
    }
  }
};

module.exports = validationService;
