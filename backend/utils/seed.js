const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');
const { deviceHash } = require('./fingerprint');

const DEMO_PASSWORD = 'Demo@1234';

const NAMES = [
  ['Aarav Gupta', '21CS001'], ['Diya Sharma', '21CS002'], ['Kabir Singh', '21CS003'],
  ['Meera Joshi', '21CS004'], ['Rohan Das', '21CS005'], ['Sara Ali', '21CS006'],
  ['Vivaan Roy', '21CS007'], ['Ananya Rao', '21CS008'], ['Ishaan Malhotra', '21CS009'],
  ['Priya Nair', '21CS010'], ['Arjun Mehta', '21CS011'], ['Naina Verma', '21CS012'],
  ['Aditya Kulkarni', '21CS013'], ['Ishita Bose', '21CS014'], ['Yash Agarwal', '21CS015'],
  ['Tara Krishnan', '21CS016'], ['Neel Bhatt', '21CS017'], ['Riya Chopra', '21CS018'],
  ['Dev Pillai', '21CS019'], ['Sneha Reddy', '21CS020'], ['Kunal Jain', '21CS021'],
  ['Myra Sen', '21CS022'], ['Arnav Saxena', '21CS023'], ['Zara Khan', '21CS024'],
];

const TOPICS = [
  'ER modelling', 'Relational algebra', 'SQL joins', 'Normalization',
  'Indexes & B-trees', 'Transactions', 'Concurrency control', 'Recovery',
  'Query optimization', 'Stored procedures', 'Triggers & views', 'NoSQL overview',
];

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const prof = await User.create({ name: 'Prof. Raman', email: 'prof@demo.com', passwordHash: hash, role: 'teacher' });

  const students = await User.create(
    NAMES.map(([name, rollNo]) => ({ name, email: `${name.split(' ')[0].toLowerCase()}@demo.com`, passwordHash: hash, role: 'student', rollNo }))
  );

  const db = await Course.create({ teacher: prof._id, code: 'CS301', name: 'Databases', students: students.map((s) => s._id) });
  const nw = await Course.create({ teacher: prof._id, code: 'CS305', name: 'Networks', students: students.slice(0, 16).map((s) => s._id) });
  const se = await Course.create({ teacher: prof._id, code: 'CS310', name: 'Software Engineering', students: students.slice(8, 20).map((s) => s._id) });

  const day = 86400000;

  // Databases: 12 past sessions (closed)
  const dbSessions = [];
  for (let i = 12; i >= 1; i--) {
    const startsAt = new Date(Date.now() - i * day - 3600000);
    const s = await Session.create({
      course: db._id, topic: TOPICS[12 - i], startsAt,
      endsAt: new Date(startsAt.getTime() + 3600000), closed: true,
    });
    dbSessions.push(s);
  }

  // Networks: 8 past sessions
  const nwTopics = ['OSI model', 'TCP basics', 'Routing', 'Subnetting', 'DNS', 'HTTP', 'Sockets', 'Wireless'];
  for (let i = 8; i >= 1; i--) {
    const startsAt = new Date(Date.now() - i * day);
    await Session.create({
      course: nw._id, topic: nwTopics[8 - i], startsAt,
      endsAt: new Date(startsAt.getTime() + 3600000), closed: true,
    });
  }

  // Software Engineering: 6 past sessions
  const seTopics = ['SDLC', 'Agile', 'UML', 'Design patterns', 'Testing', 'CI/CD'];
  for (let i = 6; i >= 1; i--) {
    const startsAt = new Date(Date.now() - i * day);
    await Session.create({
      course: se._id, topic: seTopics[6 - i], startsAt,
      endsAt: new Date(startsAt.getTime() + 3600000), closed: true,
    });
  }

  // Attendance: realistic — 3 chronic defaulters, 2 borderline, rest mostly present
  const DEFAULTERS = new Set([3, 5, 13]); // Meera, Sara, Aditya — ~30-50%
  const BORDERLINE = new Set([7, 17]); // Ananya, Riya — ~70%
  const EXCUSED = new Set([10, 20]); // Priya, Sneha — occasionally excused

  let hCounter = 0;
  const h = () => `hash-${hCounter++}`;

  const dbBatch = [];
  for (const session of dbSessions) {
    for (let j = 0; j < students.length; j++) {
      const st = students[j];
      const roll = Math.random();
      let status = 'present';
      if (DEFAULTERS.has(j)) { if (roll < 0.35) status = 'absent'; }
      else if (BORDERLINE.has(j)) { if (roll < 0.18) status = 'absent'; }
      else if (EXCUSED.has(j)) { if (roll < 0.08) status = 'excused'; else if (roll < 0.15) status = 'absent'; }
      else { if (roll < 0.05) status = 'absent'; }

      dbBatch.push({
        session: session._id, student: st._id, status,
        via: status === 'present' ? 'token' : 'manual',
        deviceHash: status === 'present' ? h() : null,
        at: session.startsAt,
        ...(status === 'absent' ? { overrideReason: 'auto-marked on session close' } : {}),
        ...(status === 'excused' ? { overrideReason: 'Medical / sports leave on file' } : {}),
      });
    }
  }
  await Attendance.insertMany(dbBatch);

  // Networks + SE attendance (lighter — just enough for analytics)
  const nwSessions = await Session.find({ course: nw._id }).sort('startsAt');
  const nwBatch = [];
  for (const session of nwSessions) {
    for (let j = 0; j < 16; j++) {
      const st = students[j];
      const roll = Math.random();
      const status = DEFAULTERS.has(j) && roll < 0.3 ? 'absent' : roll < 0.06 ? 'absent' : 'present';
      nwBatch.push({
        session: session._id, student: st._id, status,
        via: status === 'present' ? 'token' : 'manual',
        deviceHash: status === 'present' ? h() : null,
        at: session.startsAt,
        ...(status === 'absent' ? { overrideReason: 'auto-marked on session close' } : {}),
      });
    }
  }
  await Attendance.insertMany(nwBatch);

  const seSessions = await Session.find({ course: se._id }).sort('startsAt');
  const seBatch = [];
  for (const session of seSessions) {
    for (let j = 8; j < 20; j++) {
      const st = students[j];
      const roll = Math.random();
      const status = roll < 0.08 ? 'absent' : 'present';
      seBatch.push({
        session: session._id, student: st._id, status,
        via: status === 'present' ? 'token' : 'manual',
        deviceHash: status === 'present' ? h() : null,
        at: session.startsAt,
        ...(status === 'absent' ? { overrideReason: 'auto-marked on session close' } : {}),
      });
    }
  }
  await Attendance.insertMany(seBatch);

  // One anomaly pair + one audited override in Databases
  const midSession = dbSessions[6];
  await Attendance.updateMany(
    { session: midSession._id, student: { $in: [students[2]._id, students[4]._id] } },
    { deviceHash: 'shared-device-anomaly', anomalous: true }
  );
  await Attendance.findOneAndUpdate(
    { session: dbSessions[1]._id, student: students[0]._id },
    { status: 'excused', via: 'manual', overrideReason: 'Medical leave — certificate on file' }
  );

  return { prof, students, courses: [db, nw, se] };
}

module.exports = seed;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
