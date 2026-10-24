const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');
const { makeToken, verifyToken } = require('../utils/sessionToken');

let ctx, prof, aarav, diya, notEnrolled, openSession, closedSession;

before(async () => {
  ctx = await startTest();
  prof = await login(ctx, 'prof@demo.com');
  aarav = await login(ctx, 'aarav@demo.com');
  diya = await login(ctx, 'diya@demo.com');
  const stranger = await api(ctx, 'POST', '/auth/register', { body: { name: 'Stranger Student', email: 'stranger@example.com', password: 'Str@12345', role: 'student' } });
  notEnrolled = stranger.body;
  openSession = ctx.data.sessions[ctx.data.sessions.length - 1]; // not closed
  closedSession = ctx.data.sessions[0];
});

after(async () => stopTest(ctx));

// ---- token unit tests ----------------------------------------------------
test('attendance tokens rotate per minute bucket and accept ±1', () => {
  const sid = 'session-abc';
  const t1 = makeToken(sid, 1_700_000_000_000);
  const t2 = makeToken(sid, 1_700_000_000_000 + 61_000);
  assert.notEqual(t1, t2);
  assert.equal(verifyToken(t1, sid, 1_700_000_000_000 + 30_000), 'ok');
  // one bucket later t1 becomes the "previous" token and t2 is current
  assert.equal(verifyToken(t2, sid, 1_700_000_000_000 + 61_500), 'ok');
  assert.equal(verifyToken(t1, sid, 1_700_000_000_000 + 61_500), 'stale');
  assert.equal(verifyToken(t1, sid, 1_700_000_000_000 + 121_000), 'invalid');
  assert.equal(verifyToken('ZZZZZZZZZZZZ', sid), 'invalid');
});

// ---- health & auth -------------------------------------------------------
test('health endpoint responds ok', async () => {
  const r = await api(ctx, 'GET', '/health');
  assert.equal(r.status, 200);
});

test('login rejects wrong password with 401', async () => {
  const r = await api(ctx, 'POST', '/auth/login', { body: { email: 'prof@demo.com', password: 'nope@123' } });
  assert.equal(r.status, 401);
});

test('courses require auth (401)', async () => {
  const r = await api(ctx, 'GET', '/courses');
  assert.equal(r.status, 401);
});

// ---- courses & sessions --------------------------------------------------
test('teacher creates a course; duplicate codes rejected', async () => {
  const ok = await api(ctx, 'POST', '/courses', { token: prof.token, body: { code: 'cs410', name: 'Compilers' } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.code, 'CS410');
  const dupe = await api(ctx, 'POST', '/courses', { token: prof.token, body: { code: 'CS410', name: 'Compilers 2' } });
  assert.equal(dupe.status, 409);
});

test('students cannot create courses (403)', async () => {
  const r = await api(ctx, 'POST', '/courses', { token: aarav.token, body: { code: 'X101', name: 'Hack The Timetable' } });
  assert.equal(r.status, 403);
});

test('teacher starts a session with a time window', async () => {
  const starts = new Date(Date.now() - 5 * 60000).toISOString();
  const r = await api(ctx, 'POST', `/courses/${ctx.data.db._id}/sessions`, {
    token: prof.token, body: { topic: 'Normalization II', startsAt: starts, endsAt: new Date(Date.now() + 55 * 60000).toISOString() },
  });
  assert.equal(r.status, 201);
  ctx.extraSession = r.body;
});

test('inverted session window is rejected (400)', async () => {
  const r = await api(ctx, 'POST', `/courses/${ctx.data.db._id}/sessions`, {
    token: prof.token, body: { startsAt: new Date().toISOString(), endsAt: new Date(Date.now() - 60000).toISOString() },
  });
  assert.equal(r.status, 400);
});

// ---- check-in ------------------------------------------------------------
test('teacher QR endpoint returns a rotating token', async () => {
  const r = await api(ctx, 'GET', `/sessions/${ctx.extraSession._id}/qr`, { token: prof.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.token.length === 12);
  assert.equal(r.body.expiresInSeconds, 60);
  ctx.qrToken = r.body.token;
});

test('students check in with the live token', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: aarav.token, body: { token: ctx.qrToken }, headers: { userAgent: 'aarav-iphone' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.status, 'present');
});

test('duplicate check-in from the same device is idempotent', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: aarav.token, body: { token: ctx.qrToken }, headers: { userAgent: 'aarav-iphone' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.idempotent, true);
});

test('same student from a different device returns 409 (proxy signal)', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: aarav.token, body: { token: ctx.qrToken }, headers: { userAgent: 'aarav-laptop' } });
  assert.equal(r.status, 409);
  assert.ok(r.body.error.message.includes('different device'));
});

test('wrong or expired token is rejected (400)', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: diya.token, body: { token: 'AAAAAAAAAAAA' } });
  assert.equal(r.status, 400);
});

test('non-enrolled students cannot check in (403)', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: notEnrolled.token, body: { token: ctx.qrToken } });
  assert.equal(r.status, 403);
});

// ---- overrides & closing -------------------------------------------------
test('teacher overrides with an audited reason', async () => {
  const roster = await api(ctx, 'GET', `/sessions/${ctx.extraSession._id}/roster`, { token: prof.token });
  assert.equal(roster.status, 200);
  const unmarked = roster.body.roster.find((x) => x.status === 'not-marked');
  assert.ok(unmarked, 'someone is still unmarked');
  // create a record first via a live token then override it
  const qr = await api(ctx, 'GET', `/sessions/${ctx.extraSession._id}/qr`, { token: prof.token });
  const rec = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/checkin`, { token: diya.token, body: { token: qr.body.token }, headers: { userAgent: 'diya-pixel' } });
  assert.equal(rec.status, 201);
  const override = await api(ctx, 'PATCH', `/attendance/${rec.body._id}/override`, { token: prof.token, body: { status: 'excused', reason: 'Hospital appointment — slip attached' } });
  assert.equal(override.status, 200);
  assert.equal(override.body.via, 'manual');
  assert.ok(override.body.overrideReason.includes('Hospital'));
});

test('overrides without a reason are rejected (400)', async () => {
  const roster = await api(ctx, 'GET', `/sessions/${openSession._id}/roster`, { token: prof.token });
  const rec = roster.body.roster.find((x) => x.status === 'present');
  const r = await api(ctx, 'PATCH', `/attendance/${rec._id || '000000000000000000000000'}/override`, { token: prof.token, body: { status: 'absent', reason: '' } });
  assert.equal(r.status, 400);
});

test('closing the session auto-marks the rest absent', async () => {
  const r = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/close`, { token: prof.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.autoAbsent >= 8, `most of 12 students were absent: ${r.body.autoAbsent}`);
  const again = await api(ctx, 'POST', `/sessions/${ctx.extraSession._id}/close`, { token: prof.token });
  assert.equal(again.status, 409);
});

test('check-in on a closed session is rejected (409)', async () => {
  const qr = await api(ctx, 'GET', `/sessions/${closedSession._id}/qr`, { token: prof.token });
  assert.equal(qr.status, 409); // closed sessions emit no token at all
});

// ---- analytics -----------------------------------------------------------
test('analytics computes percentages and flags below-75% students', async () => {
  const r = await api(ctx, 'GET', `/courses/${ctx.data.db._id}/analytics`, { token: prof.token });
  assert.equal(r.status, 200);
  const warned = r.body.perStudent.filter((p) => p.warning);
  assert.ok(warned.length >= 2, 'Meera (33%) and Sara (50%) must be flagged');
  assert.ok(r.body.heatmap.length >= 8);
  assert.ok(r.body.anomalies >= 2, 'the shared-device pair is flagged');
});

test('csv export includes per-session marks', async () => {
  const res = await fetch(`${ctx.base}/courses/${ctx.data.db._id}/export.csv`, { headers: { Authorization: `Bearer ${prof.token}` } });
  assert.equal(res.status, 200);
  const csv = await res.text();
  assert.ok(csv.includes('student'));
  assert.ok(csv.includes('Aarav Gupta'));
  assert.ok(csv.includes('P') || csv.includes('A'));
});

test('students cannot pull the raw export (403)', async () => {
  const r = await api(ctx, 'GET', `/courses/${ctx.data.db._id}/export.csv`, { token: aarav.token });
  assert.equal(r.status, 403);
});

test('students can view their own attendance', async () => {
  const r = await api(ctx, 'GET', `/courses/${ctx.data.db._id}/my-attendance`, { token: aarav.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.records.length >= 8);
});
