const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    topic: { type: String, trim: true, maxlength: 120 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
