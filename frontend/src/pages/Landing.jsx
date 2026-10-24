import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4">
        <Link to="/courses" className="flex items-center gap-2.5 text-xl font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald2 text-lg text-white shadow-lg shadow-emerald-300">✓</span> AttendEase
        </Link>
        <Link to={user ? '/courses' : '/register'} className="rounded-full bg-emerald2 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5">
          {user ? 'My courses' : 'Start taking attendance'}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="reveal py-14 text-center sm:py-20">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald2">
            <span className="scan h-2 w-2 rounded-full bg-emerald2" /> rotating codes · device bound
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.06] sm:text-6xl">
            Presence you can<br /><span className="text-emerald2">prove</span>.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg text-slate-500">
            Roll-call eats class time and shared screenshots make proxy attendance
            trivial. AttendEase rotates the classroom code every minute —
            forwarding it is useless.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="hover-lift rounded-full bg-emerald2 px-9 py-4 font-semibold text-white shadow-xl shadow-emerald-200">Create account →</Link>
            <Link to="/login" className="glass rounded-full px-9 py-4 font-semibold text-emerald-800">Log in</Link>
          </div>
        </section>

        {/* check-in demo */}
        <section className="reveal mx-auto mb-10 max-w-2xl">
          <div className="glass rounded-[2rem] p-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">on the classroom screen</p>
            <div className="mx-auto mt-5 grid w-fit grid-cols-6 gap-1.5 rounded-2xl bg-slate-900 p-3">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} className={`h-4 w-4 rounded-sm ${(i * 7) % 3 === 0 ? 'bg-emerald-400' : 'bg-slate-700'}`} style={{ opacity: 1 - (i % 5) * 0.12 }} />
              ))}
            </div>
            <p className="mt-5 text-4xl font-bold tracking-[0.35em] text-slate-900">A7F3<span className="text-emerald2">C2</span></p>
            <p className="mt-2 text-xs text-slate-400">rotates every 60 seconds — this screenshot is already expired</p>
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              {[['Aarav', true], ['Diya', true], ['Kabir', true], ['Meera', false]].map(([name, present]) => (
                <span key={name} className={`rounded-full px-3 py-1.5 font-semibold ${present ? 'bg-emerald-soft text-emerald2' : 'bg-slate-100 text-slate-400'}`}>
                  {present && <span className="tick mr-1 inline-block">✓</span>}{name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="reveal grid gap-6 pb-16 sm:grid-cols-3">
          {[
            ['🔄', 'Rotating codes', 'The QR panel re-renders every 15 seconds on a token that rotates every minute.'],
            ['📱', 'Device-bound', 'One check-in per student per session; a second device triggers a proxy flag.'],
            ['📝', 'Audited overrides', 'Manual absent/excused changes always carry a reason — students see why.'],
          ].map(([icon, t, b]) => (
            <div key={t} className="rounded-2xl border border-slate-200/70 bg-white p-7 hover-lift">
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-2 text-sm text-slate-500">{b}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="border-y border-emerald-100 bg-white/70 py-4">
        <div className="marquee gap-10 text-xs font-bold uppercase tracking-[0.25em] text-emerald2/60">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-10 pr-10">
              {['HMAC MINUTE BUCKETS', 'PROXY DETECTION', 'AUTO-ABSENT ON CLOSE', 'CSV EXPORTS', '75% WARNINGS'].map((t) => (
                <span key={t} className="flex items-center gap-10">{t} <span>✓</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="py-10 text-center text-sm text-slate-400">AttendEase — presence you can prove.</footer>
    </div>
  );
}
