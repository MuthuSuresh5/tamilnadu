const Ward = require('../models/Ward');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

exports.createWard = async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    res.status(201).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWards = async (req, res) => {
  try {
    const wards = await Ward.find().populate('officerId', 'name phone email');
    res.json({ success: true, data: wards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id).populate('officerId', 'name phone email performanceScore');
    if (!ward) return res.status(404).json({ success: false, message: 'Ward not found' });
    res.json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWard = async (req, res) => {
  try {
    await Ward.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ward deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignOfficer = async (req, res) => {
  try {
    const { wardId, officerId } = req.body;
    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer') return res.status(404).json({ success: false, message: 'Officer not found' });
    const ward = await Ward.findByIdAndUpdate(wardId, { officerId, officerName: officer.name }, { new: true });
    await User.findByIdAndUpdate(officerId, {
      wardNumber: ward.wardNumber,
      $addToSet: { wardNumbers: ward.wardNumber }
    });
    res.json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWardStats = async (req, res) => {
  try {
    const { wardNumber } = req.params;
    const [ward, categoryStats, statusStats] = await Promise.all([
      Ward.findOne({ wardNumber }).populate('officerId', 'name performanceScore totalResolved'),
      Complaint.aggregate([
        { $match: { wardNumber: parseInt(wardNumber) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { wardNumber: parseInt(wardNumber) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    res.json({ success: true, data: { ward, categoryStats, statusStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
