const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Cache connection across serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reuse pending connection promise
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      bufferCommands: false,
    }).then(conn => {
      logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
      return conn;
    }).catch(err => {
      cached.promise = null;
      logger.error(`MongoDB Error: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw new Error(`Database connection failed: ${err.message}`);
  }

  return cached.conn;
};

module.exports = connectDB;
