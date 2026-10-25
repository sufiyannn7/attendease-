const mongoose = require('mongoose');

// Student → teacher "please mark my attendance" requests (e.g. missed the code).
const requestSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

requestSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRequest', requestSchema);
