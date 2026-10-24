import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/courses" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald2 text-sm text-white">✓</span> AttendEase
        </Link>
        <Link to={user ? '/courses' : '/register'} className="rounded-full bg-emerald2 px-5 py-2 text-sm font-semibold text-white">
          {user ? 'My courses' : 'Start taking attendance'}
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-24 text-center">
          <h1 className="mx-auto max-w-2xl text-5xl font-bold leading-tight">
            Presence you can <span className="text-emerald2">prove</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
            Roll-call eats class time and shared screenshots make proxy attendance
            trivial. AttendEase rotates the classroom code every minute —
            forwarding it is useless.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Link to="/register" className="rounded-full bg-emerald2 px-8 py-3 font-semibold text-white">Create account</Link>
            <Link to="/login" className="rounded-full border border-slate-200 bg-white px-8 py-3 font-semibold">Log in</Link>
          </div>
        </section>
        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {[
            ['Rotating codes', 'The QR panel re-renders every 15 seconds on a token that rotates every minute. Screenshots die instantly.'],
            ['Device-bound', 'One check-in per student per session; a second device triggers a proxy flag the teacher sees.'],
            ['Audited overrides', 'Manual absent/excused changes always carry a reason — students see why.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold">{t}</h3>
              <p className="mt-2 text-sm text-slate-500">{b}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">AttendEase — presence you can prove.</footer>
    </div>
  );
}
