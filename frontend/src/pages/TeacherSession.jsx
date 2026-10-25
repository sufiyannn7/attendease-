import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SceneBackground from '../components/SceneBackground.jsx';

function TokenMatrix({ token }) {
  const cells = token.split('').map((c) => parseInt(c, 16));
  return (
    <div className="mx-auto grid w-fit grid-cols-6 gap-1.5 rounded-2xl bg-paper p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,.15)]">
      {Array.from({ length: 36 }).map((_, i) => (
        <span key={i} className={`h-5 w-5 rounded-[3px] ${(cells[i % 12] + i) % 3 === 0 ? 'bg-ink' : 'bg-ink/10'}`} />
      ))}
    </div>
  );
}

const TONE = {
  present: { chip: 'bg-emerald-wash text-emerald-deep', avatar: 'bg-emerald', label: 'present' },
  excused: { chip: 'bg-marker-soft text-[#8a6a10]', avatar: 'bg-marker text-[#4a3600]', label: 'excused' },
  absent: { chip: 'bg-coral-soft text-coral', avatar: 'bg-coral', label: 'absent' },
  'not-marked': { chip: 'bg-paper text-pencil', avatar: 'bg-line', label: 'not marked' },
};

export default function TeacherSession() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [qr, setQr] = useState(null);
  const [roster, setRoster] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const q = await client.get(`/sessions/${sessionId}/qr`);
        if (alive) { setQr(q.data); setSeconds(15); }
        const r = await client.get(`/sessions/${sessionId}/roster`);
        if (alive) setRoster(r.data);
        client.get(`/sessions/${sessionId}/requests`).then((q) => { if (alive) setRequests(q.data); }).catch(() => {});
      } catch (err) { if (alive) setError(err.message); }
    };
    pull();
    const qrTimer = setInterval(pull, 15000);
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => { alive = false; clearInterval(qrTimer); clearInterval(tick); };
  }, [sessionId]);

  async function act(fn, okMsg) {
    try { await fn(); toast(okMsg); const r = await client.get(`/sessions/${sessionId}/roster`); setRoster(r.data); }
    catch (err) { toast(err.message, 'error'); }
  }

  if (error) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={() => window.location.reload()} /></main></div>;
  if (!roster) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-16"><div className="shimmer h-96" /></main></div>;

  const pct = roster.enrolled ? Math.round((roster.presentCount / roster.enrolled) * 100) : 0;

  return (
    <div className="relative min-h-screen">
      <SceneBackground variant="session" />
      <Navbar />
      <main className="relative mx-auto max-w-4xl px-4 py-10">
        <Link to="/courses" className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-pencil hover:text-emerald">← courses</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="display text-3xl font-bold tracking-tight">{roster.session.topic || 'Live session'}</h1>
            <p className="mono mt-1 text-xs uppercase tracking-[0.2em] text-pencil">{roster.session.course?.code} · {roster.presentCount}/{roster.enrolled} present</p>
          </div>
          {roster.session.closed ? (
            <span className="pill border border-line bg-ivory px-4 py-2 text-pencil">session closed</span>
          ) : (
            <button onClick={() => act(() => client.post(`/sessions/${sessionId}/close`), 'Closed — everyone unmarked is absent')}
              className="btn-ink rounded-full px-5 py-2.5 text-sm font-bold">Close session</button>
          )}
        </div>

        {/* quick stats strip */}
        <div className="mono mt-4 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider text-pencil">
          <div className="card px-3 py-2.5"><p className="text-xl font-bold text-emerald-deep">{roster.presentCount}</p>present</div>
          <div className="card px-3 py-2.5"><p className="text-xl font-bold text-coral">{roster.enrolled - roster.presentCount}</p>to mark</div>
          <div className="card px-3 py-2.5"><p className="text-xl font-bold text-[#8a6a10]">{requests.length}</p>requests</div>
          <div className="card px-3 py-2.5"><p className="text-xl font-bold text-ink">{roster.enrolled}</p>enrolled</div>
        </div>

        {/* rotating QR signal */}
        {!roster.session.closed && qr && (
          <section className="signal-card mt-6 p-8 text-center">
            <div className="radar-sweep pointer-events-none absolute inset-y-0 left-1/2 w-[140%] -translate-x-1/2" style={{ background: 'conic-gradient(from 0deg, rgba(13,147,115,.16), transparent 70deg)' }} />
            <div className="relative">
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,.5)] [&_svg]:h-44 [&_svg]:w-44"
                dangerouslySetInnerHTML={{ __html: qr.qrSvg || '' }} />
              <p className="mono mt-5 text-4xl font-bold tracking-[0.4em] text-marker" style={{ textShadow: '0 0 24px rgba(255,197,61,.4)' }}>{qr.token}</p>
              <p className="mono mt-3 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                scan or type · rotates every minute · refresh in {seconds}s
              </p>
            </div>
          </section>
        )}

        {/* attendance requests */}
        {requests.length > 0 && (
          <section className="mt-6 rounded-[22px] border-2 border-marker/50 bg-marker-soft p-5">
            <h2 className="display font-bold text-[#8a6a10]">✋ Attendance requests ({requests.length})</h2>
            <ul className="mt-3 space-y-2">
              {requests.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ivory px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-bold">{r.student?.name} <span className="mono text-xs font-normal text-pencil">{r.student?.rollNo}</span></p>
                    <p className="text-xs italic text-ink-soft">“{r.reason}”</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => act(async () => { await client.post(`/attendance-requests/${r._id}/decide`, { decision: 'approve' }); }, `Approved ${r.student?.name} — marked present`)}
                      className="btn-primary rounded-full px-4 py-1.5 text-xs font-bold">Approve → present</button>
                    <button onClick={() => act(async () => { await client.post(`/attendance-requests/${r._id}/decide`, { decision: 'reject' }); }, `Rejected ${r.student?.name}`)}
                      className="btn-ghost rounded-full px-4 py-1.5 text-xs font-bold">Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* roster */}
        <section className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <p className="display font-bold">Live roster</p>
            <span className="pill bg-emerald-wash px-3 py-1 text-emerald-deep">{roster.presentCount}/{roster.enrolled}</span>
          </div>
          <ul className="divide-y divide-line/70">
            {roster.roster.map((x, i) => {
              const tone = TONE[x.status] || TONE['not-marked'];
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition hover:bg-paper">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white ${tone.avatar}`}>{x.student?.name?.[0] || '?'}</span>
                    <div>
                      <p className="font-semibold">{x.student?.name}</p>
                      <p className="mono text-[10px] text-pencil">{x.student?.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {x.anomalous && <span className="pill bg-coral px-2.5 py-1 text-white">⚠ device anomaly</span>}
                    <span className={`pill px-3 py-1 ${tone.chip}`}>{x.status}</span>
                    {!roster.session.closed && (
                      <span className="flex items-center gap-1">
                        <span className="mono mr-1 hidden text-[9px] uppercase tracking-wider text-pencil sm:block">mark</span>
                        {[
                          ['P', 'present', 'bg-emerald hover:brightness-110'],
                          ['A', 'absent', 'bg-coral hover:brightness-110'],
                          ['E', 'excused', 'bg-marker hover:brightness-110'],
                        ].map(([letter, status, tone]) => (
                          <button key={letter} title={`Mark ${status}`}
                            onClick={() => act(
                              () => client.post(`/sessions/${sessionId}/manual`, { studentId: x.student?._id || x.student, status, reason: `Marked ${status} by teacher during session` }),
                              `${x.student?.name} → ${status}`
                            )}
                            className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold text-white transition ${tone}`}>
                            {letter}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
