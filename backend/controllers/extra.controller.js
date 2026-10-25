const { z } = require('zod');
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

const AttendanceRequest = require('../models/AttendanceRequest.model');

// ── Manual marking: teacher marks ANY enrolled student (even not-marked ones).
exports.manualMark = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
  const parsed = z.object({
    studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student id'),
    status: z.enum(['present', 'absent', 'excused']),
    reason: z.string().trim().min(3, 'A short reason is required for the audit trail').max(300),
  }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);

  const session = await Session.findById(req.params.sessionId).populate('course');
  if (!session) throw new AppError(404, 'Session not found');
  if (String(session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  if (!session.course.students.some((s) => String(s) === parsed.data.studentId)) {
    throw new AppError(404, 'That student is not enrolled in this course');
  }

  // Upsert: works for both not-marked students and existing records.
  const record = await Attendance.findOneAndUpdate(
    { session: session._id, student: parsed.data.studentId },
    {
      $set: {
        status: parsed.data.status,
        via: 'manual',
        overrideReason: parsed.data.reason,
        overriddenBy: req.user.id,
        at: new Date(),
        anomalous: false,
        deviceHash: null,
      },
    },
    { new: true, upsert: true }
  );
  res.json(record);
});

// ── Attendance requests: student asks, teacher decides.
exports.requestAttendance = asyncHandler(async (req, res) => {
  const parsed = z.object({ reason: z.string().trim().min(3, 'Tell the teacher why (3+ characters)').max(300) })
    .safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);

  const session = await Session.findById(req.params.sessionId).populate('course');
  if (!session) throw new AppError(404, 'Session not found');
  if (!session.course.students.some((s) => String(s) === String(req.user.id))) {
    throw new AppError(403, 'You are not enrolled in this course');
  }
  const dupe = await AttendanceRequest.findOne({ session: session._id, student: req.user.id, status: { $in: ['pending', 'approved'] } });
  if (dupe) throw new AppError(409, dupe.status === 'pending' ? 'You already have a pending request for this session' : 'Your attendance for this session was already approved');

  const request = await AttendanceRequest.create({
    session: session._id, student: req.user.id, reason: parsed.data.reason,
  });
  res.status(201).json(request);
});

exports.listRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
  const session = await Session.findById(req.params.sessionId).populate('course');
  if (!session) throw new AppError(404, 'Session not found');
  if (String(session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  const requests = await AttendanceRequest.find({ session: session._id, status: 'pending' })
    .populate('student', 'name rollNo').sort('createdAt');
  res.json(requests);
});

exports.decideRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
  const parsed = z.object({ decision: z.enum(['approve', 'reject']) }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);

  const request = await AttendanceRequest.findById(req.params.id).populate({ path: 'session', populate: { path: 'course' } });
  if (!request) throw new AppError(404, 'Request not found');
  if (String(request.session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  if (request.status !== 'pending') throw new AppError(409, 'This request was already decided');

  request.status = parsed.data.decision === 'approve' ? 'approved' : 'rejected';
  request.decidedAt = new Date();
  await request.save();

  if (parsed.data.decision === 'approve') {
    await Attendance.findOneAndUpdate(
      { session: request.session._id, student: request.student },
      {
        $set: {
          status: 'present', via: 'manual',
          overrideReason: `Approved from attendance request: "${request.reason}"`,
          overriddenBy: req.user.id, at: new Date(),
        },
      },
      { new: true, upsert: true }
    );
  }
  res.json(request);
});

exports.myRequests = asyncHandler(async (req, res) => {
  const requests = await AttendanceRequest.find({ student: req.user.id })
    .populate({ path: 'session', select: 'startsAt topic', populate: { path: 'course', select: 'code name' } })
    .sort('-createdAt').limit(20);
  res.json(requests);
});

// Current live (open, time-window active) session for a course — powers the
// "🔴 Live — check in" student button and the teacher's resume link.
exports.liveSession = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError(404, 'Course not found');
  const isTeacher = String(course.teacher) === String(req.user.id);
  const isEnrolled = course.students.some((s) => String(s) === String(req.user.id));
  if (!isTeacher && !isEnrolled) throw new AppError(403, 'Not part of this course');

  const now = new Date();
  const live = await Session.findOne({
    course: course._id,
    closed: false,
    startsAt: { $lte: new Date(now.getTime() + 5 * 60000) },
    endsAt: { $gte: now },
  }).sort('-startsAt');
  res.json(live || null);
});
