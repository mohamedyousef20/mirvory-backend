const { baseSchema, Joi, patterns } = require('./base.schema');

// Product status enum
const PRODUCT_STATUS = ['draft', 'published', 'archived', 'out_of_stock'];

// Product schema
const createProductSchema = baseSchema.keys({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().min(0).precision(2).required(),
  compareAtPrice: Joi.number().min(0).precision(2).greater(Joi.ref('price')).messages({
    'number.greater': 'Compare price must be greater than the original price'
  }),
  costPerItem: Joi.number().min(0).precision(2).max(Joi.ref('price')),
  sku: Joi.string().allow('', null),
  barcode: Joi.string().allow('', null),
  quantity: Joi.number().integer().min(0).default(0),
  weight: Joi.number().min(0).precision(2),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('g'),
  status: Joi.string().valid(...PRODUCT_STATUS).default('draft'),
  category: Joi.string().pattern(patterns.objectId).required(),
  tags: Joi.array().items(Joi.string().min(2).max(50)),
  images: Joi.array().items(Joi.string().uri()),
  isTaxable: Joi.boolean().default(true),
  seo: Joi.object({
    title: Joi.string().max(70),
    description: Joi.string().max(160),
  }),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      options: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required(),
        })
      ),
      price: Joi.number().min(0).precision(2).required(),
      sku: Joi.string().allow('', null),
      quantity: Joi.number().integer().min(0).default(0),
      weight: Joi.number().min(0).precision(2),
    })
  ),
});

// Update product schema
const updateProductSchema = baseSchema.keys({
  name: Joi.string().min(3).max(200),
  description: Joi.string().min(10),
  price: Joi.number().min(0).precision(2),
  compareAtPrice: Joi.number().min(0).precision(2).greater(Joi.ref('price')).messages({
    'number.greater': 'Compare price must be greater than the original price'
  }),
  costPerItem: Joi.number().min(0).precision(2),
  sku: Joi.string().allow('', null),
  barcode: Joi.string().allow('', null),
  quantity: Joi.number().integer().min(0),
  weight: Joi.number().min(0).precision(2),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz'),
  status: Joi.string().valid(...PRODUCT_STATUS),
  category: Joi.string().pattern(patterns.objectId),
  tags: Joi.array().items(Joi.string().min(2).max(50)),
  images: Joi.array().items(Joi.string().uri()),
  isTaxable: Joi.boolean(),
  seo: Joi.object({
    title: Joi.string().max(70),
    description: Joi.string().max(160),
  }),
  variants: Joi.array().items(
    Joi.object({
      _id: Joi.string().pattern(patterns.objectId),
      name: Joi.string(),
      options: Joi.array().items(
        Joi.object({
          name: Joi.string(),
          value: Joi.string(),
        })
      ),
      price: Joi.number().min(0).precision(2),
      sku: Joi.string().allow('', null),
      quantity: Joi.number().integer().min(0),
      weight: Joi.number().min(0).precision(2),
    })
  ),
}).min(1);

// Product query schema
const productQuerySchema = baseSchema.keys({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc').default('newest'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  category: Joi.string().pattern(patterns.objectId),
  status: Joi.string().valid(...PRODUCT_STATUS),
  search: Joi.string(),
  inStock: Joi.boolean(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  PRODUCT_STATUS,
};
