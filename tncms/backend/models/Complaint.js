const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String },
  updatedBy: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  citizenId: { type: String, required: true },
  citizenName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  voterId: { type: String, trim: true, uppercase: true },
  wardNumber: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['road', 'water', 'electricity', 'sanitation', 'drainage', 'streetlight', 'garbage', 'park', 'other'],
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['submitted', 'accepted', 'processing', 'completed', 'rejected'],
    default: 'submitted',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  remarks: { type: String, trim: true },
  completionPhotos: [{ type: String }],
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedOfficerName: { type: String },
  submittedDate: { type: Date, default: Date.now },
  acceptedDate: { type: Date },
  completedDate: { type: Date },
  expectedCompletionDate: { type: Date },
  timeline: [timelineSchema],
  isDuplicate: { type: Boolean, default: false },
  aiCategory: { type: String },
  sentimentScore: { type: Number },
}, { timestamps: true });

complaintSchema.index({ complaintId: 1, citizenId: 1, wardNumber: 1, status: 1, category: 1 });

// Only run on updates (not on create — controller handles timeline on create)
complaintSchema.pre('save', async function () {
  // Only push timeline on status change for existing documents
  if (!this.isNew && this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      message: `Status changed to ${this.status}`,
      updatedBy: this.assignedOfficerName || 'System',
    });
    if (this.status === 'accepted') this.acceptedDate = new Date();
    if (this.status === 'completed') this.completedDate = new Date();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
