const Course = require('../models/Course.model');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Defaulter radar: students below the threshold across a course, ranked by risk.
exports.defaulters = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
  const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
  if (!course) throw new AppError(404, 'Course not found');
  const sessions = await Session.find({ course: course._id, closed: true }).sort('startsAt');
  const records = await Attendance.find({ session: { $in: sessions.map((s) => s._id) } }).populate('student', 'name rollNo');

  const threshold = Math.min(100, Math.max(50, Number(req.query.threshold) || 75));
  const perStudent = new Map();
  for (const sId of course.students) perStudent.set(String(sId), { present: 0, excused: 0, total: 0, trend: [] });
  for (const s of sessions) {
    for (const [sId, entry] of perStudent) {
      const rec = records.find((r) => String(r.session) === String(s._id) && String(r.student._id) === sId);
      if (!rec) { entry.total += 1; entry.trend.push(0); continue; }
      if (rec.status === 'present') { entry.present += 1; entry.total += 1; entry.trend.push(1); }
      else if (rec.status === 'excused') { entry.excused += 1; entry.trend.push(null); }
      else { entry.total += 1; entry.trend.push(0); }
    }
  }

  const rows = [];
  for (const [sId, e] of perStudent) {
    const counted = e.total - e.excused;
    if (counted === 0) continue;
    const pct = Math.round((e.present / counted) * 100);
    if (pct >= threshold) continue;
    const student = records.find((r) => String(r.student._id) === sId)?.student || (await User.findById(sId).select('name rollNo'));
    // risk: recent 3 sessions all-missed → critical
    const last3 = e.trend.slice(-3).filter((t) => t !== null);
    const risk = last3.length === 3 && last3.every((t) => t === 0) ? 'critical' : pct < threshold - 15 ? 'high' : 'watch';
    rows.push({ student, percent: pct, deficitTo75: Math.max(0, Math.ceil((0.75 * counted - e.present) / 0.25)), risk });
  }
  res.json({ threshold, defaulters: rows.sort((a, b) => a.percent - b.percent) });
});

// Student calendar: month-view attendance per course.
exports.calendar = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError(404, 'Course not found');
  const enrolled = course.students.some((s) => String(s) === String(req.user.id));
  const isTeacher = String(course.teacher) === String(req.user.id);
  if (!enrolled && !isTeacher) throw new AppError(403, 'Not part of this course');

  const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const sessions = await Session.find({ course: course._id, startsAt: { $gte: start, $lt: end } }).sort('startsAt');
  const records = await Attendance.find({ session: { $in: sessions.map((s) => s._id) }, student: req.user.id });
  const bySession = new Map(records.map((r) => [String(r.session), r]));
  res.json({
    month,
    days: sessions.map((s) => ({
      date: new Date(s.startsAt).toISOString().slice(0, 10),
      topic: s.topic,
      status: bySession.get(String(s._id))?.status || 'not-marked',
    })),
  });
});
