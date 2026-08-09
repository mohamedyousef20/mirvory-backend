import { baseSchema, Joi, patterns } from './base.schema.js';

// Category schema
export const createCategorySchema = baseSchema.keys({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string()
    .regex(/^[a-z0-9-]+$/)
    .message('Slug can only contain letters, numbers, and hyphens')
    .lowercase()
    .required(),
  description: Joi.string().allow(''),
  parent: Joi.string().pattern(patterns.objectId).allow(null).default(null),
  isActive: Joi.boolean().default(true),
  featured: Joi.boolean().default(false),
  image: Joi.string().uri().allow('', null),
  seo: Joi.object({
    title: Joi.string().max(70),
    description: Joi.string().max(160),
    keywords: Joi.string().allow(''),
  }),
  order: Joi.number().integer().min(0).default(0),
});

// Update category schema
export const updateCategorySchema = baseSchema.keys({
  name: Joi.string().min(2).max(50),
  slug: Joi.string()
    .regex(/^[a-z0-9-]+$/)
    .message('Slug can only contain letters, numbers, and hyphens')
    .lowercase(),
  description: Joi.string().allow(''),
  parent: Joi.string().pattern(patterns.objectId).allow(null),
  isActive: Joi.boolean(),
  featured: Joi.boolean(),
  image: Joi.string().uri().allow('', null),
  seo: Joi.object({
    title: Joi.string().max(70),
    description: Joi.string().max(160),
    keywords: Joi.string().allow(''),
  }),
  order: Joi.number().integer().min(0),
}).min(1);

// Category query schema
export const categoryQuerySchema = baseSchema.keys({
  parent: Joi.string().pattern(patterns.objectId).allow('root', null),
  isActive: Joi.boolean(),
  featured: Joi.boolean(),
  search: Joi.string(),
  sort: Joi.string().valid('name_asc', 'name_desc', 'order_asc', 'order_desc').default('order_asc'),
  withProducts: Joi.boolean().default(false),
  withChildren: Joi.boolean().default(true),
});

export default {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
};