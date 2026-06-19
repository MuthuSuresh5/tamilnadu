const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const generateTokens = (id) => ({
  accessToken: jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE }),
});

const generateCitizenId = async () => {
  // Find the highest existing citizenId and increment
  const lastCitizen = await User.findOne({ role: 'citizen', citizenId: { $exists: true } })
    .sort({ citizenId: -1 })
    .select('citizenId')
    .lean();
  
  if (lastCitizen?.citizenId) {
    const lastNumber = parseInt(lastCitizen.citizenId.replace('CIT-', ''));
    return `CIT-${lastNumber + 1}`;
  }
  return 'CIT-1001';
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, voterId, wardNumber, address } = req.body;
    
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
    }
    
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: 'Phone number already registered' });

    const citizenId = await generateCitizenId();
    const user = await User.create({ name, phone, email, password, voterId, wardNumber, address, citizenId });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Create welcome notification (don't fail registration if this fails)
    try {
      await Notification.create({ userId: user._id, title: 'Welcome!', message: `Welcome to TN Smart Complaint System, ${name}!`, type: 'system' });
    } catch (notifError) {
      logger.error(`Notification creation failed: ${notifError.message}`);
    }

    res.status(201).json({ success: true, data: user, accessToken, refreshToken });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password, voterId } = req.body;
    
    // Find user by phone
    const user = await User.findOne({ phone }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }
    
    // Citizens login with phone + voter ID
    if (user.role === 'citizen') {
      if (!voterId) {
        return res.status(400).json({ success: false, message: 'Voter ID is required for citizen login' });
      }
      
      // Check if voter ID matches
      if (user.voterId !== voterId) {
        return res.status(401).json({ success: false, message: 'Invalid voter ID' });
      }
    } else {
      // Admin and Officer login with phone + password
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }
      
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: user, accessToken, refreshToken });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, ...tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    logger.info(`Profile update request from user ${req.user._id}`);
    
    const { name, email, address, designation } = req.body;
    const update = {};
    
    if (name) update.name = name;
    if (email !== undefined) update.email = email;
    if (address !== undefined) update.address = address;
    
    if (req.user.role === 'admin' && designation !== undefined) {
      update.designation = designation;
    }
    
    if (req.file) {
      update.profilePhoto = req.file.resolvedPath;
      logger.info(`Profile photo uploaded: ${req.file.resolvedPath}`);
    }
    
    logger.info(`Updating profile with: ${JSON.stringify(update)}`);
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      update, 
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    logger.info(`Profile updated successfully for user ${req.user._id}`);
    res.json({ success: true, data: user, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error(`Profile update error for user ${req.user?._id}: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Failed to update profile. Please try again.' 
        : error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
