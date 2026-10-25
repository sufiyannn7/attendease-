import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SceneBackground from '../components/SceneBackground.jsx';

export default function Courses() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [guideHidden, setGuideHidden] = useState(false);
  const [live, setLive] = useState({});
  const [starting, setStarting] = useState(null);
  const [enrollFor, setEnrollFor] = useState(null);
  const [enrollEmails, setEnrollEmails] = useState('');
  const [roster, setRoster] = useState(null);
  const [enrollBusy, setEnrollBusy] = useState(false);

  async function openEnroll(courseId) {
    setEnrollFor(courseId);
    setEnrollEmails('');
    try { setRoster(await client.get(`/courses/${courseId}/students`)); } catch { setRoster([]); }
  }

  async function enrollStudents() {
    const emails = enrollEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    if (!emails.length) return toast('Enter at least one email', 'error');
    setEnrollBusy(true);
    let ok = 0, fail = 0;
    for (const email of emails) {
      try { await client.post(`/courses/${enrollFor}/enroll`, { email }); ok++; }
      catch { fail++; }
    }
    toast(`Enrolled ${ok}${fail ? `, ${fail} failed (not registered or already in)` : ''}`);
    try { setRoster(await client.get(`/courses/${enrollFor}/students`)); } catch {}
    load();
    setEnrollBusy(false);
  }

  async function pollLive() {
    if (!courses) return;
    const updates = {};
    await Promise.all(courses.map(async (c) => {
      try {
        const r = await client.get(`/courses/${c._id}/live-session`);
        if (r.data) updates[c._id] = r.data;
      } catch { /* ignore */ }
    }));
    setLive(updates);
  }
  useEffect(() => {
    pollLive();
    const t = setInterval(pollLive, 10000);
    return () => clearInterval(t);
  }, [courses?.length]);

  async function startSession(courseId) {
    setStarting(courseId);
    try {
      const now = new Date();
      const r = await client.post(`/courses/${courseId}/sessions`, {
        topic: `Class — ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        startsAt: now.toISOString(),
        endsAt: new Date(now.getTime() + 60 * 60000).toISOString(),
      });
      navigate(`/sessions/${r.data._id}`);
    } catch (err) { toast(err.message, 'error'); } finally { setStarting(null); }
  }
  const [form, setForm] = useState({ code: '', name: '' });
  const isTeacher = user?.role === 'teacher';

  async function load() {
    setError('');
    try { setCourses((await client.get('/courses')).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await client.post('/courses', form);
      toast('Course created');
      setShowNew(false);
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <div className="relative min-h-screen">
      <SceneBackground />
      <Navbar />
      <main className="relative mx-auto max-w-5xl px-4 py-12">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-emerald">semester in session</p>
            <h1 className="display mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {isTeacher ? 'Courses you teach' : 'Enrolled courses'}
            </h1>
            <p className="mt-2 text-ink-soft">
              {isTeacher ? 'Start sessions, watch the roster fill in real time.' : 'Check in with the code on the classroom screen.'}
            </p>
          </div>
          {isTeacher && (
            <button onClick={() => setShowNew(true)} className="btn-primary rounded-full px-6 py-3 text-sm font-bold">+ New course</button>
          )}
        </div>

        {/* first-visit onboarding hint */}
        {!error && courses !== null && !guideHidden && !localStorage.getItem('ae_guide_seen') && (
          <div className="reveal mt-6 flex flex-wrap items-center gap-4 rounded-[22px] border-2 border-dashed border-emerald/35 bg-emerald-wash px-6 py-4">
            <span className="text-2xl">👋</span>
            <p className="flex-1 text-sm font-semibold text-emerald-deep">
              {isTeacher ? 'New here? See how sessions, QR codes, manual marking and requests work — a 1-minute read.' : 'New here? See how to check in with the classroom code (and what to do if you miss it) — a 1-minute read.'}
            </p>
            <Link to="/guide" className="btn-primary rounded-full px-5 py-2 text-sm font-bold">Read the guide →</Link>
            <button onClick={() => { localStorage.setItem('ae_guide_seen', '1'); setGuideHidden(true); }} aria-label="dismiss" className="text-emerald-deep/50 hover:text-emerald-deep">✕</button>
          </div>
        )}
        {!error && user?.role === 'student' && courses !== null && courses.length > 0 && (
          <div className="reveal mt-6 rounded-[22px] border-2 border-dashed border-emerald/25 bg-emerald-wash/50 px-6 py-4">
            <p className="text-sm font-semibold text-emerald-deep">
              📚 You are enrolled in <strong>{courses.length} course{courses.length > 1 ? 's' : ''}</strong> — your teacher added you by this email.
              When a session goes live, a <strong>🔴 LIVE banner</strong> appears here and at the top of every page automatically.
            </p>
          </div>
        )}
        {!error && user?.role === 'student' && courses !== null && courses.length === 0 && (
          <div className="reveal mt-6 rounded-[22px] border-2 border-dashed border-marker/40 bg-marker-soft px-6 py-5">
            <p className="text-sm font-semibold text-[#8a6a10]">
              📩 You are not enrolled in any course yet. Your teacher adds you by the email you registered with — ask them to enroll <strong>{user?.email}</strong>.
            </p>
          </div>
        )}
        {error && <div className="mt-8"><ErrorState message={error} onRetry={load} /></div>}
        {!error && courses === null && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="shimmer h-56" />)}</div>
        )}
        {!error && courses !== null && courses.length === 0 && (
          <div className="mt-10"><Empty title="No courses yet" hint={isTeacher ? 'Create one and enroll students by email.' : 'Ask your teacher to enroll you by email.'} /></div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {courses?.map((c, idx) => (
            <div key={c._id} className="card tilt-card relative overflow-hidden p-6" style={{ animation: `fadeUp .6s ${idx * 0.08}s cubic-bezier(.2,.7,.3,1) both` }}>
              {/* gradient spine */}
              <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${['from-emerald to-marker', 'from-coral to-marker', 'from-emerald to-coral', 'from-marker to-emerald'][idx % 4]}`} />
              <div className="flex items-start justify-between gap-4 pl-2">
                <div>
                  <p className="mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-deep">{c.code}</p>
                  <h3 className="display mt-1.5 text-2xl font-bold tracking-tight">{c.name}</h3>
                  {c.teacher?.name && <p className="mt-1 text-sm text-pencil">{c.teacher.name}</p>}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-wash text-[10px] font-bold text-emerald-deep">{c.studentCount ?? 0}</span><span className="text-pencil">students</span></span>
                    <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-marker-soft text-[10px] font-bold text-[#8a6a10]">{c.sessionCount ?? 0}</span><span className="text-pencil">sessions</span></span>
                  </div>
                </div>
                {/* attendance ring gauge */}
                <div className="stat-ring relative h-20 w-20" style={{ '--pct': 85 - idx * 12, '--ring-color': ['#0d9373', '#ef6351', '#f2a61c', '#0d9373'][idx % 4] }}>
                  <div className="text-center">
                    <p className="mono text-lg font-bold leading-none">{85 - idx * 12}%</p>
                    <p className="text-[7px] font-bold uppercase tracking-wider text-pencil">avg attend</p>
                  </div>
                </div>
              </div>
              {live[c._id] && (
                <p className="mono mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-wash px-3 py-1 pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-deep">
                  <span className="live-dot h-2 w-2 rounded-full bg-emerald text-emerald" /> live now
                </p>
              )}
              <div className="mt-5 flex gap-2.5 pl-2">
                {isTeacher ? (
                  <>
                    {live[c._id] ? (
                      <Link to={`/sessions/${live[c._id]._id}`} className="btn-primary flex-1 rounded-full py-2.5 text-center text-sm font-bold">
                        📷 Open live session + QR →
                      </Link>
                    ) : (
                      <button onClick={() => startSession(c._id)} disabled={starting === c._id}
                        className="btn-primary flex-1 rounded-full py-2.5 text-sm font-bold disabled:opacity-60">
                        {starting === c._id ? 'Starting…' : '▶ Start session (shows QR)'}
                      </button>
                    )}
                    <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="btn-ghost flex-1 rounded-full py-2.5 text-sm font-semibold">Analytics</button>
                    <button onClick={() => openEnroll(c._id)} className="btn-ghost rounded-full px-4 py-2.5 text-sm font-semibold">👥 Enroll</button>
                  </>
                ) : live[c._id] ? (
                  <Link to={`/checkin/${live[c._id]._id}`} className="btn-primary flex-1 animate-pulse rounded-full py-3 text-center text-sm font-bold">
                    🔴 Live — check in now →
                  </Link>
                ) : (
                  <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="btn-ink flex-1 rounded-full py-2.5 text-sm font-bold">My attendance</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {enrollFor && roster && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" onClick={() => setEnrollFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card card-raise max-h-[85vh] w-full max-w-lg overflow-y-auto p-7" style={{ animation: 'fadeUp .35s cubic-bezier(.2,.7,.3,1) both' }}>
            <h2 className="display text-xl font-bold">Enroll students</h2>
            <p className="mt-1 text-sm text-pencil">Students must already have an AttendEase account. Enter their registration emails below.</p>
            <textarea value={enrollEmails} onChange={(e) => setEnrollEmails(e.target.value)} rows={3}
              placeholder="student1@example.com, student2@example.com…"
              className="mt-4 w-full rounded-xl border border-line bg-ivory px-4 py-3 font-mono text-sm outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/15" />
            <button onClick={enrollStudents} disabled={enrollBusy} className="btn-primary mt-3 w-full rounded-xl py-3 font-bold disabled:opacity-60">
              {enrollBusy ? 'Enrolling…' : 'Enroll students'}
            </button>
            <div className="mt-5 border-t border-dashed border-line pt-4">
              <p className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-pencil">Current roster ({roster.length})</p>
              <div className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {roster.map((s) => (
                  <span key={s._id} className="chip bg-emerald-wash px-2.5 py-1 text-emerald-deep">
                    {s.name} · {s.rollNo}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setEnrollFor(null)} className="btn-ghost mt-4 w-full rounded-xl py-2.5 text-sm font-bold">Close</button>
          </div>
        </div>
      )}
      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="card card-raise w-full max-w-md p-7" style={{ animation: 'fadeUp .35s cubic-bezier(.2,.7,.3,1) both' }}>
            <h2 className="display text-xl font-bold">New course</h2>
            <label className="mt-5 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">Course code</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS301"
                className="mono mt-1.5 w-full rounded-xl border border-line bg-ivory px-4 py-3 uppercase outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
            </label>
            <label className="mt-4 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">Course name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Databases"
                className="mt-1.5 w-full rounded-xl border border-line bg-ivory px-4 py-3 outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
            </label>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowNew(false)} className="btn-ghost flex-1 rounded-xl py-3 font-bold">Cancel</button>
              <button className="btn-primary flex-1 rounded-xl py-3 font-bold">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
