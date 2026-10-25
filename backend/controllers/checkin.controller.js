const { z } = require('zod');
const Course = require('../models/Course.model');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { makeToken, verifyToken, deviceHash } = require('../utils/sessionToken');

// The teacher's QR panel polls this; the token rotates every minute and the
// screen re-renders every 15s for good measure.
exports.qr = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') throw new AppError(403, 'Teachers only');
  const session = await Session.findById(req.params.sessionId).populate('course');
  if (!session) throw new AppError(404, 'Session not found');
  if (String(session.course.teacher) !== String(req.user.id)) throw new AppError(403, 'Not your course');
  if (session.closed) throw new AppError(409, 'Session is closed — no more check-ins');
  const now = Date.now();
  const token = makeToken(session._id, now);
  // Real scannable QR (SVG) so students can scan instead of typing.
  const QRCode = require('qrcode');
  const qrSvg = await QRCode.toString(token, { type: 'svg', margin: 1, width: 240 });
  res.json({
    token,
    qrSvg,
    sessionId: session._id,
    courseCode: session.course.code,
    topic: session.topic,
    expiresInSeconds: 60,
    renderEverySeconds: 15,
    generatedAt: new Date(now).toISOString(),
  });
});

// Student check-in: token from the teacher's screen. Idempotent per device;
// a different device for the same student is a 409 (proxy signal).
exports.checkin = asyncHandler(async (req, res) => {
  const parsed = z.object({ token: z.string().trim().min(4, 'Enter the code shown in class') }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);

  const session = await Session.findById(req.params.sessionId);
  if (!session) throw new AppError(404, 'Session not found');
  const course = await Course.findById(session.course);
  if (!course.students.some((s) => String(s) === String(req.user.id))) {
    throw new AppError(403, 'You are not enrolled in this course');
  }
  if (session.closed) throw new AppError(409, 'Session is closed');

  const hash = deviceHash(req);
  const existing = await Attendance.findOne({ session: session._id, student: req.user.id });
  if (existing) {
    if (existing.deviceHash && existing.deviceHash !== hash) {
      throw new AppError(409, 'This session already has a check-in from a different device');
    }
    return res.json({ ...existing.toObject(), idempotent: true }); // same device re-submit = no-op
  }

  const verdict = verifyToken(parsed.data.token, session._id);
  if (verdict === 'invalid') throw new AppError(400, 'Wrong or expired code — check the screen again');
  const now = new Date();
  if (now < session.startsAt) throw new AppError(409, 'Check-in opens when the session starts');

  const record = await Attendance.create({
    session: session._id,
    student: req.user.id,
    status: 'present',
    via: 'token',
    deviceHash: hash,
    at: now,
  });

  // anomaly: same device hash used by another student in this session
  const clash = await Attendance.findOne({ session: session._id, deviceHash: hash, student: { $ne: req.user.id } });
  if (clash) {
    await Attendance.updateMany({ session: session._id, deviceHash: hash }, { anomalous: true });
  }

  res.status(201).json({ ...record.toObject(), stale: verdict === 'stale', anomalous: !!clash });
});

// Student's own attendance across a course.
exports.mine = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError(404, 'Course not found');
  const sessions = await Session.find({ course: course._id }).sort('startsAt');
  const records = await Attendance.find({ session: { $in: sessions.map((s) => s._id) }, student: req.user.id });
  const bySession = new Map(records.map((r) => [String(r.session), r]));
  res.json({
    course: { _id: course._id, code: course.code, name: course.name },
    records: sessions.map((s) => ({ session: s, record: bySession.get(String(s._id)) || null })),
  });
});
