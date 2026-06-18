const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  wardNumber: { type: Number, required: true, unique: true },
  wardName: { type: String, required: true, trim: true },
  wardNameTamil: { type: String, trim: true },
  district: { type: String, trim: true },
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  officerName: { type: String },
  totalComplaints: { type: Number, default: 0 },
  resolvedComplaints: { type: Number, default: 0 },
  pendingComplaints: { type: Number, default: 0 },
  population: { type: Number },
  area: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Ward', wardSchema);
