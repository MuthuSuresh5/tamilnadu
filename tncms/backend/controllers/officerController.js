const User = require('../models/User');
const Complaint = require('../models/Complaint');
const bcrypt = require('bcryptjs');

exports.createOfficer = async (req, res) => {
  try {
    const { name, phone, email, password, wardNumber } = req.body;
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: 'Phone already registered' });
    const officer = await User.create({ name, phone, email, password, role: 'officer', wardNumber });
    if (req.file) { officer.profilePhoto = req.file.resolvedPath; await officer.save(); }
    res.status(201).json({ success: true, data: officer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).sort({ createdAt: -1 });
    res.json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfficer = async (req, res) => {
  try {
    const officer = await User.findById(req.params.id);
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });
    const stats = await Complaint.aggregate([
      { $match: { assignedOfficer: officer._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: officer, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOfficer = async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.file) update.profilePhoto = req.file.resolvedPath;
    const officer = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    res.json({ success: true, data: officer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOfficer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Officer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetOfficerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfficerPerformance = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('name wardNumber totalResolved performanceScore profilePhoto');
    const performance = await Promise.all(officers.map(async o => {
      const total = await Complaint.countDocuments({ assignedOfficer: o._id });
      const completed = await Complaint.countDocuments({ assignedOfficer: o._id, status: 'completed' });
      return { ...o.toObject(), total, completed, rate: total ? Math.round((completed / total) * 100) : 0 };
    }));
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
