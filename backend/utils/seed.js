const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');
const { deviceHash } = require('./fingerprint');

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const prof = await User.create({ name: 'Prof. Raman', email: 'prof@demo.com', passwordHash: hash, role: 'teacher' });

  const names = [
    ['Aarav Gupta', 'aarav@demo.com', '21CS001'], ['Diya Sharma', 'diya@demo.com', '21CS002'],
    ['Kabir Singh', 'kabir2@demo.com', '21CS003'], ['Meera Joshi', 'meera@demo.com', '21CS004'],
    ['Rohan Das', 'rohan@demo.com', '21CS005'], ['Sara Ali', 'sara@demo.com', '21CS006'],
    ['Vivaan Roy', 'vivaan@demo.com', '21CS007'], ['Ananya Rao', 'ananya@demo.com', '21CS008'],
    ['Ishaan Malhotra', 'ishaan@demo.com', '21CS009'], ['Priya Nair', 'priya2@demo.com', '21CS010'],
    ['Arjun Mehta', 'arjun@demo.com', '21CS011'], ['Naina Verma', 'naina@demo.com', '21CS012'],
  ];
  const students = await User.create(names.map(([name, email, rollNo]) => ({ name, email, passwordHash: hash, role: 'student', rollNo })));

  const db = await Course.create({ teacher: prof._id, code: 'CS301', name: 'Databases', students: students.map((s) => s._id) });
  const nw = await Course.create({ teacher: prof._id, code: 'CS305', name: 'Networks', students: students.slice(0, 8).map((s) => s._id) });

  const day = 86400000;
  const sessions = [];
  const topics = ['ER modelling', 'Relational algebra', 'SQL joins', 'Normalization', 'Indexes & B-trees', 'Transactions', 'Concurrency control', 'Recovery'];
  for (let i = 8; i >= 1; i--) {
    const startsAt = new Date(Date.now() - i * day);
    sessions.push(await Session.create({
      course: db._id, topic: topics[8 - i], startsAt,
      endsAt: new Date(startsAt.getTime() + 3600000),
      closed: i > 1,
    }));
  }

  // varied attendance: two students below 75%, one override, one anomaly pair
  const h1 = 'device-hash-of-aarav';
  const h2 = 'device-hash-of-diya';
  const hProxy = 'shared-device-hash-anomaly';
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    for (let j = 0; j < students.length; j++) {
      const st = students[j];
      const skip = (j === 3 && i % 3 !== 0) || (j === 5 && i % 2 !== 0) || (i === 4 && j === 1); // Meera 33%, Sara 50%, Diya missed once
      if (skip && s.closed) {
        await Attendance.create({ session: s._id, student: st._id, status: 'absent', via: 'manual', overrideReason: 'auto-marked on session close' });
        continue;
      }
      if (skip) continue;
      await Attendance.create({ session: s._id, student: st._id, status: 'present', via: 'token', deviceHash: j === 0 ? h1 : j === 1 ? h2 : `hash-${j}`, at: s.startsAt });
    }
  }
  // anomaly: same device for two different students in session 3
  await Attendance.findOneAndUpdate({ session: sessions[2]._id, student: students[2]._id }, { deviceHash: hProxy, anomalous: true });
  await Attendance.findOneAndUpdate({ session: sessions[2]._id, student: students[4]._id }, { deviceHash: hProxy, anomalous: true });
  // override with audited reason
  const overridden = await Attendance.findOne({ session: sessions[1]._id, student: students[0]._id });
  if (overridden) {
    overridden.status = 'excused';
    overridden.via = 'manual';
    overridden.overrideReason = 'Medical leave — certificate on file';
    overridden.overriddenBy = prof._id;
    await overridden.save();
  }
  return { prof, students, db, nw, sessions };
}

module.exports = seed;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
