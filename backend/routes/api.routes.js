const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const a = require('../controllers/auth.controller');
const c = require('../controllers/course.controller');
const k = require('../controllers/checkin.controller');
const extra = require('../controllers/extra.controller');
const { requireAuth } = require('../middlewares/auth');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
const checkinLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/auth/register', authLimiter, a.register);
router.post('/auth/login', authLimiter, a.login);
router.get('/auth/me', requireAuth, a.me);

router.use(requireAuth);
router.post('/courses', c.create);
router.get('/courses', c.list);
router.post('/courses/:id/enroll', c.enroll);
router.post('/courses/:id/sessions', c.startSession);
router.get('/courses/:id/analytics', c.analytics);
router.get('/courses/:id/defaulters', extra.defaulters);
router.get('/courses/:id/calendar', extra.calendar);
router.get('/courses/:id/export.csv', c.csv);
router.get('/courses/:id/my-attendance', k.mine);
router.get('/sessions/:sessionId/roster', c.roster);
router.get('/sessions/:sessionId/qr', k.qr);
router.post('/sessions/:sessionId/checkin', checkinLimiter, k.checkin);
router.patch('/attendance/:attendanceId/override', c.override);
router.post('/sessions/:sessionId/close', c.close);

module.exports = router;
