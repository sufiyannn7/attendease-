const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');

let ctx, prof, aarav, dbId;

before(async () => {
  ctx = await startTest();
  prof = await login(ctx, 'prof@demo.com');
  aarav = await login(ctx, 'aarav@demo.com');
  dbId = String(ctx.data.db._id);
});

after(async () => stopTest(ctx));

test('defaulter radar flags the seeded sub-75% students with risk levels', async () => {
  const r = await api(ctx, 'GET', `/courses/${dbId}/defaulters`, { token: prof.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.defaulters.length >= 2, `expected 2+ defaulters, got ${r.body.defaulters.length}`);
  const meera = r.body.defaulters.find((d) => d.student.name === 'Meera Joshi');
  assert.ok(meera && meera.percent < 75);
  assert.ok(['critical', 'high', 'watch'].includes(meera.risk));
  assert.ok(r.body.defaulters[0].percent <= r.body.defaulters[1].percent, 'sorted worst-first');
});

test('defaulter radar is teacher-only and honors custom thresholds', async () => {
  const denied = await api(ctx, 'GET', `/courses/${dbId}/defaulters`, { token: aarav.token });
  assert.equal(denied.status, 403);
  const strict = await api(ctx, 'GET', `/courses/${dbId}/defaulters?threshold=95`, { token: prof.token });
  assert.equal(strict.body.threshold, 95);
  assert.ok(strict.body.defaulters.length >= 4, 'higher threshold flags more students');
});

test('student calendar returns per-day statuses for the current month', async () => {
  const r = await api(ctx, 'GET', `/courses/${dbId}/calendar`, { token: aarav.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.days));
  const seeded = r.body.days.filter((d) => d.status !== 'not-marked');
  assert.ok(seeded.length >= 7, `aarav has records in past sessions, got ${seeded.length}`);
  assert.ok(seeded.every((d) => ['present', 'absent', 'excused'].includes(d.status)));
});
