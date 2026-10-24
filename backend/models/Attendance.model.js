const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'excused'], default: 'present' },
    via: { type: String, enum: ['token', 'manual'], default: 'token' },
    deviceHash: { type: String }, // sha256(user-agent + accept-language) — best-effort proxy
    at: { type: Date, default: Date.now },
    anomalous: { type: Boolean, default: false },
    // manual overrides carry an audited reason
    overrideReason: { type: String, trim: true, maxlength: 300 },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// one attendance record per (student, session) — enforced at the DB level
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
