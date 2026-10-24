const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true }
);

courseSchema.index({ teacher: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
