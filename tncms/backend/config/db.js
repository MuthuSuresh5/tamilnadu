const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  // Reuse existing connection attempt
  if (connectionPromise) {
    return connectionPromise;
  }
  
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
  });

  try {
    await connectionPromise;
    isConnected = true;
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    isConnected = false;
    connectionPromise = null;
    logger.error(`MongoDB Error: ${error.message}`);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
