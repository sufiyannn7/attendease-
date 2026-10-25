import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Courses() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
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
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
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
              {/* spine accent */}
              <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald to-marker" />
              <div className="flex items-start justify-between gap-4 pl-2">
                <div>
                  <p className="mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-deep">{c.code}</p>
                  <h3 className="display mt-1.5 text-2xl font-bold tracking-tight">{c.name}</h3>
                  {c.teacher?.name && <p className="mt-1 text-sm text-pencil">{c.teacher.name}</p>}
                </div>
                <div className="text-right">
                  <p className="serif text-3xl font-bold text-ink">{c.studentCount ?? ''}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pencil">students</p>
                  <p className="mono mt-1 text-[10px] text-pencil">{c.sessionCount ?? 0} sessions</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2.5 pl-2">
                <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="btn-ghost flex-1 rounded-full py-2.5 text-sm font-semibold">Analytics</button>
                {isTeacher ? (
                  <a href={`${client.defaults.baseURL}/courses/${c._id}/export.csv`} target="_blank" rel="noreferrer"
                    className="btn-marker flex-1 rounded-full py-2.5 text-center text-sm font-bold">⬇ Export CSV</a>
                ) : (
                  <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="btn-ink flex-1 rounded-full py-2.5 text-sm font-bold">My attendance</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

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
