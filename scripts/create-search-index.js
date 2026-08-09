/**
 * Script to create MongoDB text index for product search
 * Run this script to ensure the search index exists
 * Usage: node scripts/create-search-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();

const createSearchIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if index already exists
    const indexes = await Product.collection.getIndexes();
    const textIndexExists = indexes['product_text_search'];

    if (textIndexExists) {
      console.log('Text index already exists. Dropping and recreating...');
      await Product.collection.dropIndex('product_text_search');
    }

    // Create text index with weights
    await Product.collection.createIndex(
      {
        title: 'text',
        description: 'text',
        brand: 'text',
        tags: 'text'
      },
      {
        weights: {
          title: 10,
          description: 5,
          brand: 3,
          tags: 2
        },
        name: 'product_text_search'
      }
    );

    console.log('✓ Text index created successfully');
    console.log('Index name: product_text_search');
    console.log('Fields: title (weight: 10), description (weight: 5), brand (weight: 3), tags (weight: 2)');

    // Verify index
    const newIndexes = await Product.collection.getIndexes();
    console.log('\nCurrent indexes on products collection:');
    Object.keys(newIndexes).forEach(indexName => {
      console.log(`  - ${indexName}`);
    });

  } catch (error) {
    console.error('Error creating search index:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

createSearchIndex();
