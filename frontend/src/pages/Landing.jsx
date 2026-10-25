import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '🔄', title: 'Rotating codes', body: 'The classroom code re-renders every 15 seconds on a token that rotates each minute. Screenshots die instantly.' },
  { icon: '📱', title: 'Device-bound', body: 'One check-in per student per session. A second device triggers a proxy flag only the teacher sees.' },
  { icon: '✍️', title: 'Audited overrides', body: 'Every absent/excused change carries a reason — visible to the student, logged forever.' },
  { icon: '📊', title: 'Defaulter radar', body: 'Sub-75% students ranked by risk, with exactly how many classes they need to attend.' },
];

const STATS = [['15s', 'QR refresh cadence'], ['60s', 'token rotation'], ['0', 'useful screenshots']];

function SignalCard({ className = '' }) {
  const cells = Array.from({ length: 36 }, (_, i) => (i * 7 + (i % 5) * 3) % 4);
  return (
    <div className={`signal-card w-[340px] p-6 sm:w-[370px] ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between">
        <span className="chip border border-live/0 bg-marker/15 px-2.5 py-1 text-marker">CS301 · LIVE SESSION</span>
        <span className="mono text-[10px] tracking-[0.3em] text-emerald-300/70">ROTATING</span>
      </div>
      {/* decorative QR matrix over radar rings */}
      <div className="relative mx-auto mt-5 h-40 w-40">
        <div className="absolute inset-[-30%] rounded-full border border-emerald-400/20" />
        <div className="absolute inset-[-60%] rounded-full border border-emerald-400/10" />
        <div className="radar-sweep absolute inset-[-30%]" style={{ background: 'conic-gradient(from 0deg, rgba(13,147,115,.35), transparent 60deg)' }} />
        <div className="relative grid h-full w-full grid-cols-6 gap-1 rounded-xl bg-[#0e1626] p-2.5">
          {cells.map((v, i) => <span key={i} className={`rounded-[3px] ${v === 0 ? 'bg-emerald-400' : v === 1 ? 'bg-emerald-400/50' : 'bg-white/8'}`} />)}
        </div>
      </div>
      <p className="mono mt-5 text-center text-3xl font-bold tracking-[0.35em] text-white">A7F3C2</p>
      <p className="mono mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-slate-400">expires in 43s · screenshots won’t work</p>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-24 right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-emerald/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-marker/15 blur-[110px]" />

      <header className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lg font-bold text-marker shadow-[0_10px_22px_-8px_rgba(26,35,50,.5)]">✓</span>
          <span className="display text-xl font-bold tracking-tight">Attend<span className="text-emerald">Ease</span></span>
        </div>
        {user ? (
          <Link to="/courses" className="btn-primary rounded-full px-6 py-2.5 text-sm font-bold">My courses</Link>
        ) : (
          <Link to="/register" className="btn-primary rounded-full px-6 py-2.5 text-sm font-bold">Start taking attendance</Link>
        )}
      </header>

      <main className="relative mx-auto max-w-6xl px-4">
        {/* ── hero ── */}
        <section className="reveal grid items-center gap-14 py-14 lg:grid-cols-[1.08fr_1fr] lg:py-24">
          <div>
            <p className="mono mb-6 inline-flex items-center gap-2 rounded-full border border-emerald/25 bg-emerald-wash px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-deep">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" /> rotating codes · device bound
            </p>
            <h1 className="display text-5xl font-bold leading-[1.03] tracking-tight sm:text-7xl">
              Presence you<br />can <span className="marker-stroke">prove.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Roll-call eats class time and forwarded screenshots make proxy attendance
              trivial. AttendEase rotates the classroom code every minute — by the time
              it’s shared, it’s already expired.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary rounded-full px-9 py-4 text-base font-bold">Create account →</Link>
              <Link to="/login" className="btn-ghost rounded-full px-9 py-4 font-semibold">Log in</Link>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
              {STATS.map(([n, l]) => (
                <div key={l} className="card px-4 py-4 text-center">
                  <p className="mono text-2xl font-bold text-emerald-deep">{n}</p>
                  <p className="mt-1 text-[11px] leading-tight text-pencil">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="perspective relative mx-auto flex h-[440px] w-full max-w-md items-center justify-center">
            <div className="absolute h-[330px] w-[300px] rotate-[-7deg] rounded-[26px] border border-ink/10 bg-ink/5" style={{ transform: 'perspective(1200px) rotateY(14deg) rotateZ(-6deg) translateY(24px)' }} />
            <div className="absolute h-[330px] w-[300px] rounded-[26px] border border-ink/5 bg-ink/[.03]" style={{ transform: 'perspective(1200px) rotateY(7deg) rotateZ(-3deg) translateY(10px)' }} />
            <SignalCard className="float-3d relative z-10" />
          </div>
        </section>

        {/* ── how it works strip ── */}
        <section className="reveal card-raise card mx-auto mb-14 max-w-3xl overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="display font-bold">Live roster · CS301 Databases</p>
            <span className="pill bg-emerald-wash px-3 py-1 text-emerald-deep">9 / 12 present</span>
          </div>
          <div className="grid grid-cols-4 gap-px bg-line/60 sm:grid-cols-6">
            {['present', 'present', 'absent', 'present', 'present', 'present', 'present', 'excused', 'present', 'absent', 'present', 'present'].map((st, i) => (
              <div key={i} className={`flex flex-col items-center gap-1.5 bg-ivory px-2 py-4`}>
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${st === 'present' ? 'bg-emerald' : st === 'excused' ? 'bg-marker text-[#8a6a10]' : 'bg-coral'}`}>
                  {st === 'present' ? '✓' : st === 'excused' ? 'E' : 'A'}
                </span>
                <span className="mono text-[9px] uppercase tracking-wider text-pencil">21CS0{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mono border-t border-dashed border-line px-6 py-3 text-center text-[10px] uppercase tracking-[0.25em] text-pencil">
            shared device flagged ⚠ · override audit-trail on tap
          </p>
        </section>

        {/* ── features ── */}
        <section className="reveal grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card tilt-card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-marker-soft to-white text-2xl shadow-[0_8px_18px_-8px_rgba(255,197,61,.55)]">{f.icon}</span>
              <h3 className="display mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="relative border-y border-line bg-ivory/70 py-4">
        <div className="marquee gap-10 text-xs font-bold uppercase tracking-[0.25em] text-ink/40">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-10 pr-10">
              {['HMAC MINUTE BUCKETS', 'PROXY DETECTION', 'AUTO-ABSENT ON CLOSE', 'CSV EXPORTS', '75% WARNINGS', 'AUDITED OVERRIDES'].map((t) => (
                <span key={t} className="flex items-center gap-10">{t} <span className="text-emerald">✓</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="relative py-12 text-center">
        <p className="serif text-sm italic text-pencil">AttendEase — presence you can prove.</p>
      </footer>
    </div>
  );
}
