const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Error: ${error.message}`);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
