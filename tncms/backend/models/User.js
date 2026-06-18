const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, sparse: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
  designation: { type: String, trim: true, default: '' },
  voterId: { type: String, trim: true, uppercase: true },
  wardNumber: { type: Number },
  wardNumbers: [{ type: Number }],
  address: { type: String, trim: true },
  profilePhoto: { type: String, default: '' },
  citizenId: { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  performanceScore: { type: Number, default: 0 },
  totalResolved: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
