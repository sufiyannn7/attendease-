const { z } = require('zod');
const Course = require('../models/Course.model');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const courseSchema = z.object({
  code: z.string().trim().min(2).max(12).toUpperCase(),
  name: z.string().trim().min(3, 'Name the course').max(120),
});

const sessionSchema = z.object({
  topic: z.string().trim().max(120).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine((v) => v.endsAt > v.startsAt, { message: 'Session end must be after start' });

const overrideSchema = z.object({
  status: z.enum(['present', 'absent', 'excused']),
  reason: z.string().trim().min(3, 'Overrides need an auditable reason').max(300),
});

function requireTeacher(req) {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
}

exports.create = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const dupe = await Course.findOne({ teacher: req.user.id, code: parsed.data.code });
  if (dupe) throw new AppError(409, `You already teach a course coded ${parsed.data.code}`);
  const course = await Course.create({ ...parsed.data, teacher: req.user.id });
  res.status(201).json(course);
});

exports.list = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).sort('code');
    const withCounts = await Promise.all(courses.map(async (c) => ({ ...c.toObject(), studentCount: c.students.length, sessionCount: await Session.countDocuments({ course: c._id }) })));
    return res.json(withCounts);
  }
  const courses = await Course.find({ students: req.user.id }).populate('teacher', 'name').sort('code');
  res.json(courses);
});

exports.enroll = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const parsed = z.object({ email: z.string().trim().email('Enter a valid student email') }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
  if (!course) throw new AppError(404, 'Course not found');
  const student = await User.findOne({ email: parsed.data.email, role: 'student' });
  if (!student) throw new AppError(404, 'No student account with that email');
  if (course.students.some((s) => String(s) === String(student._id))) throw new AppError(409, 'Already enrolled');
  course.students.push(student._id);
  await course.save();
  res.json(course);
});

exports.startSession = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
  if (!course) throw new AppError(404, 'Course not found');
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const session = await Session.create({ ...parsed.data, course: course._id });
  res.status(201).json(session);
});

// Live roster for the teacher during a session.
exports.roster = asyncHandler(async (req, res) => {
  requireTeacher(req);
  // populate course → students so not-yet-marked students still have name/rollNo
  const session = await Session.findById(req.params.sessionId).populate({
    path: 'course',
    populate: { path: 'students', select: 'name rollNo' },
  });
  if (!session) throw new AppError(404, 'Session not found');
  if (String(session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  const records = await Attendance.find({ session: session._id }).populate('student', 'name rollNo');
  const roster = session.course.students.map((s) => {
    const rec = records.find((r) => String(r.student._id) === String(s._id || s));
    return {
      _id: rec?._id,
      student: s.name ? s : (rec ? rec.student : { _id: s, name: 'Unknown', rollNo: '?' }),
      status: rec ? rec.status : 'not-marked',
      at: rec?.at, via: rec?.via, anomalous: rec?.anomalous,
    };
  });
  res.json({ session, roster, presentCount: records.filter((r) => r.status === 'present').length, enrolled: session.course.students.length });
});

exports.override = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const record = await Attendance.findById(req.params.attendanceId).populate({ path: 'session', populate: { path: 'course' } });
  if (!record) throw new AppError(404, 'Attendance record not found');
  if (String(record.session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  const parsed = overrideSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  record.status = parsed.data.status;
  record.via = 'manual';
  record.overrideReason = parsed.data.reason;
  record.overriddenBy = req.user.id;
  await record.save();
  res.json(record);
});

// Mark everyone absent once the session closes (students without records).
exports.close = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const session = await Session.findById(req.params.sessionId).populate('course');
  if (!session) throw new AppError(404, 'Session not found');
  if (String(session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  if (session.closed) throw new AppError(409, 'Session already closed');
  const marked = await Attendance.find({ session: session._id }).select('student');
  const presentIds = new Set(marked.map((m) => String(m.student)));
  const docs = session.course.students.filter((s) => !presentIds.has(String(s))).map((s) => ({ session: session._id, student: s, status: 'absent', via: 'manual', overrideReason: 'auto-marked on session close', overriddenBy: req.user.id }));
  if (docs.length) await Attendance.insertMany(docs);
  session.closed = true;
  await session.save();
  res.json({ closed: true, autoAbsent: docs.length });
});

// Analytics: per-student %, heatmap, below-75% warnings.
exports.analytics = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError(404, 'Course not found');
  const isTeacher = String(course.teacher) === String(req.user.id);
  const isEnrolled = course.students.some((s) => String(s) === String(req.user.id));
  if (!isTeacher && !isEnrolled) throw new AppError(403, 'Not part of this course');

  const sessions = await Session.find({ course: course._id }).sort('startsAt');
  const records = await Attendance.find({ session: { $in: sessions.map((s) => s._id) } }).populate('student', 'name rollNo');

  const byStudent = new Map();
  for (const sId of course.students) byStudent.set(String(sId), { present: 0, excused: 0, absent: 0 });
  for (const r of records) {
    const entry = byStudent.get(String(r.student._id));
    if (!entry) continue;
    if (r.status === 'present') entry.present += 1;
    else if (r.status === 'excused') entry.excused += 1;
    else entry.absent += 1;
  }
  const closedSessions = sessions.filter((s) => s.closed).length;
  const perStudent = course.students.length
    ? await Promise.all(
        [...byStudent.entries()].map(async ([id, e]) => {
          const student = records.find((r) => String(r.student._id) === id)?.student || (await User.findById(id).select('name rollNo'));
          const counted = closedSessions - e.excused;
          const pct = counted > 0 ? Math.round((e.present / counted) * 100) : null;
          return { student, ...e, percent: pct, warning: pct !== null && pct < 75 };
        })
      )
    : [];

  // heatmap: session × present-ratio
  const heatmap = sessions.map((s) => {
    const recs = records.filter((r) => String(r.session) === String(s._id));
    const present = recs.filter((r) => r.status === 'present').length;
    return { sessionId: s._id, topic: s.topic, date: s.startsAt, present, total: course.students.length, ratio: course.students.length ? Math.round((present / course.students.length) * 100) : 0 };
  });

  res.json({
    sessions: sessions.length,
    closedSessions,
    perStudent: perStudent.sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || '')),
    heatmap,
    anomalies: records.filter((r) => r.anomalous).length,
  });
});

exports.csv = asyncHandler(async (req, res) => {
  requireTeacher(req);
  const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
  if (!course) throw new AppError(404, 'Course not found');
  const sessions = await Session.find({ course: course._id }).sort('startsAt');
  const records = await Attendance.find({ session: { $in: sessions.map((s) => s._id) } }).populate('student', 'name rollNo email');

  const rows = [['student', 'roll_no', 'email', ...sessions.map((s) => new Date(s.startsAt).toISOString().slice(0, 10)), 'percent_present']];
  for (const sId of course.students) {
    const rec = records.find((r) => String(r.student._id) === String(sId))?.student || (await User.findById(sId).select('name rollNo email'));
    const cells = sessions.map((s) => {
      const r = records.find((x) => String(x.session) === String(s._id) && String(x.student._id) === String(sId));
      return r ? r.status[0].toUpperCase() : '-';
    });
    const present = cells.filter((c) => c === 'P').length;
    const pct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
    rows.push([rec?.name || '', rec?.rollNo || '', rec?.email || '', ...cells, pct]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${course.code}-attendance.csv"`);
  res.send(csv);
});
