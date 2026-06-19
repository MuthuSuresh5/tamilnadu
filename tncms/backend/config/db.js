const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }
  
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    isConnected = false;
    logger.error(`MongoDB Error: ${error.message}`);
    // Don't throw in serverless - just log
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
};

module.exports = connectDB;
