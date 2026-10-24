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
  const [isTeacher, setIsTeacher] = useState(user?.role === 'teacher');

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
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isTeacher ? 'Courses you teach' : 'Enrolled courses'}</h1>
            <p className="text-slate-500">{isTeacher ? 'Start sessions, watch the roster fill live.' : 'Check in with the code on the classroom screen.'}</p>
          </div>
          {isTeacher && (
            <button onClick={() => setShowNew(true)} className="rounded-full bg-emerald2 px-5 py-2.5 text-sm font-semibold text-white">+ New course</button>
          )}
        </div>

        {error && <div className="mt-6"><ErrorState message={error} onRetry={load} /></div>}
        {!error && courses === null && <Loading label="Loading courses…" />}
        {!error && courses !== null && courses.length === 0 && (
          <div className="mt-6"><Empty title="No courses yet" hint={isTeacher ? 'Create one and enroll students by email.' : 'Ask your teacher to enroll you by email.'} /></div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {courses?.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald2">{c.code}</p>
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  {c.teacher?.name && <p className="text-sm text-slate-400">{c.teacher.name}</p>}
                </div>
                <div className="text-right text-xs text-slate-400">
                  {c.studentCount !== undefined && <p>{c.studentCount} students</p>}
                  {c.sessionCount !== undefined && <p>{c.sessionCount} sessions</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {isTeacher ? (
                  <>
                    <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold hover:border-emerald2 hover:text-emerald2">Analytics</button>
                    <a href={`${client.defaults.baseURL}/courses/${c._id}/export.csv`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold hover:border-emerald2 hover:text-emerald2">CSV</a>
                  </>
                ) : (
                  <button onClick={() => navigate(`/courses/${c._id}/analytics`)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold hover:border-emerald2 hover:text-emerald2">My attendance</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold">New course</h2>
            <label className="mt-3 block"><span className="text-sm font-semibold">Course code</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS301"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase outline-none focus:border-emerald2" /></label>
            <label className="mt-3 block"><span className="text-sm font-semibold">Course name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Databases"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald2" /></label>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600">Cancel</button>
              <button className="flex-1 rounded-xl bg-emerald2 py-2.5 font-semibold text-white">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
