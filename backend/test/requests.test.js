const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');

let ctx, prof, aarav, ananya, dbId, closedSession, openSession;

before(async () => {
  ctx = await startTest();
  prof = await login(ctx, 'prof@demo.com');
  aarav = await login(ctx, 'aarav@demo.com');
  ananya = await login(ctx, 'ananya@demo.com');
  dbId = String(ctx.data.db._id);
  const sessions = ctx.data.sessions;
  closedSession = sessions.find((s) => s.closed);
  openSession = sessions.find((s) => !s.closed) || sessions[sessions.length - 1];
});

after(async () => stopTest(ctx));

test('qr endpoint now returns a real scannable SVG', async () => {
  const r = await api(ctx, 'GET', `/sessions/${closedSession._id}/qr`, { token: prof.token });
  assert.equal(r.status, 409); // closed sessions refuse — sanity unchanged
  const live = await api(ctx, 'POST', `/courses/${dbId}/sessions`, {
    token: prof.token,
    body: { topic: 'QR probe', startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 3600_000).toISOString() },
  });
  assert.equal(live.status, 201);
  ctx.liveSession = live.body;
  const qr = await api(ctx, 'GET', `/sessions/${live.body._id}/qr`, { token: prof.token });
  assert.equal(qr.status, 200);
  assert.ok(qr.body.qrSvg.startsWith('<svg'), 'qrSvg is an SVG');
  assert.ok(qr.body.qrSvg.length > 400);
  assert.equal(qr.body.token.length, 12);
});

test('teacher manually marks a not-marked student present (upsert)', async () => {
  const roster = await api(ctx, 'GET', `/sessions/${ctx.liveSession._id}/roster`, { token: prof.token });
  const unmarked = roster.body.roster.find((x) => x.status === 'not-marked');
  assert.ok(unmarked, 'fresh session has unmarked students');
  const r = await api(ctx, 'POST', `/sessions/${ctx.liveSession._id}/manual`, {
    token: prof.token,
    body: { studentId: unmarked.student?._id || unmarked.student, status: 'present', reason: 'Walked in late, verified in person' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'present');
  assert.equal(r.body.via, 'manual');
  // idempotent re-mark to absent
  const again = await api(ctx, 'POST', `/sessions/${ctx.liveSession._id}/manual`, {
    token: prof.token,
    body: { studentId: unmarked.student?._id || unmarked.student, status: 'absent', reason: 'Correction: left early' },
  });
  assert.equal(again.body.status, 'absent');
});

test('students and outsiders cannot manual-mark (403)', async () => {
  const r1 = await api(ctx, 'POST', `/sessions/${ctx.liveSession._id}/manual`, { token: aarav.token, body: { studentId: aarav.id, status: 'present', reason: 'self-mark attempt' } });
  assert.equal(r1.status, 403);
});

test('manual mark rejects unenrolled students and thin reasons', async () => {
  const bad1 = await api(ctx, 'POST', `/sessions/${ctx.liveSession._id}/manual`, { token: prof.token, body: { studentId: '0'.repeat(24), status: 'present', reason: 'not enrolled' } });
  assert.equal(bad1.status, 404);
  const bad2 = await api(ctx, 'POST', `/sessions/${ctx.liveSession._id}/manual`, { token: prof.token, body: { studentId: ctx.data.students[0]._id.toString(), status: 'present', reason: 'x' } });
  assert.equal(bad2.status, 400);
});

test('student requests attendance on a closed session; teacher approves; attendance appears', async () => {
  const req1 = await api(ctx, 'POST', `/sessions/${closedSession._id}/request`, { token: ananya.token, body: { reason: 'Was in the medical room, have a slip' } });
  assert.equal(req1.status, 201);
  const dupe = await api(ctx, 'POST', `/sessions/${closedSession._id}/request`, { token: ananya.token, body: { reason: 'again' } });
  assert.equal(dupe.status, 409);

  const list = await api(ctx, 'GET', `/sessions/${closedSession._id}/requests`, { token: prof.token });
  assert.ok(list.body.some((r) => r.student?.name === 'Ananya Rao' && r.status === 'pending'));
  const target = list.body.find((r) => r.student?.name === 'Ananya Rao');

  const approve = await api(ctx, 'POST', `/attendance-requests/${target._id}/decide`, { token: prof.token, body: { decision: 'approve' } });
  assert.equal(approve.status, 200);
  assert.equal(approve.body.status, 'approved');

  const again = await api(ctx, 'POST', `/attendance-requests/${target._id}/decide`, { token: prof.token, body: { decision: 'reject' } });
  assert.equal(again.status, 409);

  const mine = await api(ctx, 'GET', '/attendance-requests/mine', { token: ananya.token });
  assert.ok(mine.body.some((r) => r.status === 'approved'));
});

test('student cannot request on a course they are not enrolled in (403)', async () => {
  const reg = await api(ctx, 'POST', '/auth/register', { body: { name: 'Outsider', email: 'outsider2@example.com', password: 'Out@12345', role: 'student', rollNo: '21CS999' } });
  const r = await api(ctx, 'POST', `/sessions/${closedSession._id}/request`, { token: reg.body.token, body: { reason: 'not my class' } });
  assert.equal(r.status, 403);
});
