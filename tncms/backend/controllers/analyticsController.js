const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Ward = require('../models/Ward');

exports.getDashboardStats = async (req, res) => {
  try {
    const [total, accepted, processing, completed, rejected, totalOfficers, totalWards] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'accepted' }),
      Complaint.countDocuments({ status: 'processing' }),
      Complaint.countDocuments({ status: 'completed' }),
      Complaint.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'officer' }),
      Ward.countDocuments(),
    ]);
    const resolutionRate = total ? Math.round((completed / total) * 100) : 0;
    res.json({ success: true, data: { total, accepted, processing, completed, rejected, totalOfficers, totalWards, resolutionRate } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyTrend = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const stats = await Complaint.aggregate([
      { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: { _id: { month: { $month: '$createdAt' }, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWardHeatmap = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: '$wardNumber', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPriorityStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCitizenStats = async (req, res) => {
  try {
    const { citizenId, phone } = req.user
    const complaints = await Complaint.find({ $or: [{ citizenId }, { phone }] })
    const stats = {
      total: complaints.length,
      submitted: complaints.filter(c => c.status === 'submitted').length,
      accepted: complaints.filter(c => c.status === 'accepted').length,
      processing: complaints.filter(c => c.status === 'processing').length,
      completed: complaints.filter(c => c.status === 'completed').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
    }
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getPublicTeam = async (req, res) => {
  try {
    const members = await User.find(
      { role: { $in: ['admin', 'officer'] }, isActive: true },
      'name role designation wardNumber phone profilePhoto'
    ).sort({ role: 1, createdAt: 1 });
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
