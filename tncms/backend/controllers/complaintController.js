const Complaint = require('../models/Complaint');
const Ward = require('../models/Ward');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// AI: Auto categorize based on keywords
const autoCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const map = {
    road: ['road', 'pothole', 'சாலை', 'குழி'],
    water: ['water', 'pipe', 'தண்ணீர்', 'குழாய்'],
    electricity: ['electricity', 'current', 'மின்சாரம்', 'light'],
    sanitation: ['toilet', 'sanitation', 'கழிவு', 'சுகாதாரம்'],
    drainage: ['drain', 'drainage', 'வடிகால்', 'flood'],
    streetlight: ['streetlight', 'street light', 'தெரு விளக்கு'],
    garbage: ['garbage', 'waste', 'குப்பை', 'trash'],
    park: ['park', 'garden', 'பூங்கா'],
  };
  for (const [cat, keywords] of Object.entries(map)) {
    if (keywords.some(k => text.includes(k))) return cat;
  }
  return 'other';
};

// AI: Priority prediction
const predictPriority = (description) => {
  const text = description.toLowerCase();
  if (['urgent', 'emergency', 'accident', 'fire', 'flood', 'அவசரம்'].some(k => text.includes(k))) return 'urgent';
  if (['immediate', 'danger', 'risk', 'ஆபத்து'].some(k => text.includes(k))) return 'high';
  if (['soon', 'quick', 'விரைவாக'].some(k => text.includes(k))) return 'medium';
  return 'low';
};

// AI: Simple sentiment score (-1 to 1)
const sentimentScore = (text) => {
  const negative = ['bad', 'worst', 'terrible', 'disgusting', 'மோசமான', 'கோரமான'];
  const positive = ['good', 'better', 'nice', 'நல்ல', 'சரி'];
  const t = text.toLowerCase();
  let score = 0;
  negative.forEach(w => { if (t.includes(w)) score -= 0.2; });
  positive.forEach(w => { if (t.includes(w)) score += 0.2; });
  return Math.max(-1, Math.min(1, score));
};

exports.submitComplaint = async (req, res) => {
  try {
    const { citizenName, phone, voterId, wardNumber, category, title, description, locationAddress, lat, lng, priority } = req.body;

    const count = await Complaint.countDocuments();
    const complaintId = `TVK-CMP-${24000 + count + 1}`;

    // AI features
    const aiCategory = autoCategory(title, description);
    const aiPriority = priority || predictPriority(description);
    const sentiment = sentimentScore(description);

    // Duplicate detection
    const recentDuplicate = await Complaint.findOne({
      phone,
      title: { $regex: title.substring(0, 20), $options: 'i' },
      wardNumber,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const images = req.files?.map(f => f.resolvedPath) || [];

    // Get citizen ID
    const citizen = await User.findOne({ phone });
    const citizenId = citizen?.citizenId || `CIT-${1001 + count}`;

    const complaint = await Complaint.create({
      complaintId,
      citizenId,
      citizenName,
      phone,
      voterId,
      wardNumber: parseInt(wardNumber),
      category,
      title,
      description,
      location: { address: locationAddress, lat: lat ? parseFloat(lat) : undefined, lng: lng ? parseFloat(lng) : undefined },
      images,
      priority: aiPriority,
      aiCategory,
      sentimentScore: sentiment,
      isDuplicate: !!recentDuplicate,
      timeline: [{ status: 'submitted', message: 'Complaint submitted successfully', updatedBy: citizenName }],
    });

    // Update ward stats
    await Ward.findOneAndUpdate({ wardNumber: parseInt(wardNumber) }, { $inc: { totalComplaints: 1, pendingComplaints: 1 } });

    // Notify citizen if registered
    if (citizen) {
      await Notification.create({
        userId: citizen._id,
        title: 'Complaint Submitted',
        message: `Your complaint ${complaintId} has been submitted successfully.`,
        type: 'complaint_submitted',
        complaintId,
      });
    }

    // Emit socket event (optional - only if Socket.io is available)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`ward_${wardNumber}`).emit('new_complaint', { complaintId, wardNumber, category, priority: aiPriority });
        io.to('admin').emit('new_complaint', { complaintId, wardNumber, category });
      }
    } catch (err) {
      // Socket.io not available (e.g., serverless deployment)
      logger.debug('Socket.io not available');
    }

    res.status(201).json({
      success: true,
      data: { complaintId, citizenId, complaint },
      message: 'Complaint submitted successfully',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({
      $or: [{ complaintId: id }, { citizenId: id }],
    }).populate('assignedOfficer', 'name phone');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const { citizenId, phone } = req.user
    const complaints = await Complaint.find({
      $or: [{ citizenId }, { phone }]
    })
      .sort({ createdAt: -1 })
      .populate('assignedOfficer', 'name phone')
    res.json({ success: true, data: complaints })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAllComplaints = async (req, res) => {
  try {
    const { ward, status, category, priority, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'officer') {
      const officerWards = req.user.wardNumbers?.length
        ? req.user.wardNumbers
        : req.user.wardNumber ? [req.user.wardNumber] : []
      if (officerWards.length) filter.wardNumber = { $in: officerWards }
    }
    if (ward) filter.wardNumber = parseInt(ward);
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { citizenName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('assignedOfficer', 'name phone'),
      Complaint.countDocuments(filter),
    ]);

    res.json({ success: true, data: complaints, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, expectedCompletionDate } = req.body;
    const officer = req.user;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (officer.role === 'officer') {
      const officerWards = officer.wardNumbers?.length ? officer.wardNumbers : officer.wardNumber ? [officer.wardNumber] : []
      if (!officerWards.includes(complaint.wardNumber))
        return res.status(403).json({ success: false, message: 'Not your ward complaint' })
    }

    const completionPhotos = req.files?.map(f => f.resolvedPath) || [];

    complaint.status = status;
    if (remarks) complaint.remarks = remarks;
    if (expectedCompletionDate) complaint.expectedCompletionDate = new Date(expectedCompletionDate);
    if (completionPhotos.length) complaint.completionPhotos.push(...completionPhotos);
    if (!complaint.assignedOfficer) {
      complaint.assignedOfficer = officer._id;
      complaint.assignedOfficerName = officer.name;
    }

    await complaint.save();

    if (status === 'completed') {
      await Ward.findOneAndUpdate({ wardNumber: complaint.wardNumber }, { $inc: { resolvedComplaints: 1, pendingComplaints: -1 } });
      await User.findByIdAndUpdate(officer._id, { $inc: { totalResolved: 1 } });
    }

    // Notify citizen
    const citizen = await User.findOne({ phone: complaint.phone });
    if (citizen) {
      await Notification.create({
        userId: citizen._id,
        title: 'Status Update',
        message: `Your complaint ${complaint.complaintId} status is now: ${status}`,
        type: 'status_update',
        complaintId: complaint.complaintId,
      });
    }

    // Emit socket event (optional - only if Socket.io is available)
    try {
      const io = req.app.get('io');
      if (io && citizen) {
        io.to(citizen._id.toString()).emit('status_update', { complaintId: complaint.complaintId, status });
      }
    } catch (err) {
      // Socket.io not available (e.g., serverless deployment)
      logger.debug('Socket.io not available');
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    await Ward.findOneAndUpdate({ wardNumber: complaint.wardNumber }, { $inc: { totalComplaints: -1 } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompletedFeed = async (req, res) => {
  try {
    const complaints = await Complaint.find({ status: 'completed' })
      .sort({ completedDate: -1 })
      .limit(20)
      .select('complaintId wardNumber category completedDate assignedOfficerName title completionPhotos');
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
