import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Decorative matrix derived from the token (the code underneath is what
// students actually type — the visual QR pattern is illustrative).
function TokenMatrix({ token }) {
  const cells = token.split('').map((c) => parseInt(c, 16));
  return (
    <div className="mx-auto grid w-fit grid-cols-6 gap-1 rounded-2xl bg-white p-3">
      {Array.from({ length: 36 }).map((_, i) => (
        <span key={i} className={`h-5 w-5 rounded-[3px] ${(cells[i % 12] + i) % 3 === 0 ? 'bg-slate-900' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

export default function TeacherSession() {
  const { sessionId } = useParams();
  const toast = useToast();
  const [qr, setQr] = useState(null);
  const [roster, setRoster] = useState(null);
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
      } catch (err) {
        if (alive) setError(err.message);
      }
    };
    pull();
    const qrTimer = setInterval(pull, 15000);
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => { alive = false; clearInterval(qrTimer); clearInterval(tick); };
  }, [sessionId]);

  async function act(fn, msg) {
    try { await fn(); toast(msg); const r = await client.get(`/sessions/${sessionId}/roster`); setRoster(r.data); }
    catch (err) { toast(err.message, 'error'); }
  }

  if (error) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={() => window.location.reload()} /></main></div>;
  if (!roster) return <div className="min-h-screen"><Navbar /><Loading label="Opening the session…" /></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/courses" className="text-sm text-slate-400 hover:text-emerald2">← Courses</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{roster.session.topic || 'Live session'}</h1>
            <p className="text-sm text-slate-500">{roster.presentCount}/{roster.enrolled} present</p>
          </div>
          {roster.session.closed ? (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">Session closed</span>
          ) : (
            <button onClick={() => act(() => client.post(`/sessions/${sessionId}/close`), 'Closed — everyone unmarked is absent')}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Close session</button>
          )}
        </div>

        {!roster.session.closed && qr && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <TokenMatrix token={qr.token} />
            <p className="mt-6 text-5xl font-bold tracking-[0.4em] text-slate-900">{qr.token}</p>
            <p className="mt-3 text-sm text-slate-400">students type this code · rotates every minute · refresh in {seconds}s</p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-500">Live roster</div>
          <ul className="divide-y divide-slate-100">
            {roster.roster.map((x, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${x.status === 'present' ? 'bg-emerald2' : x.status === 'excused' ? 'bg-sky-500' : x.status === 'absent' ? 'bg-red-400' : 'bg-slate-300'}`}>
                    {x.student?.name?.[0] || '?'}
                  </span>
                  <div>
                    <p className="font-semibold">{x.student?.name}</p>
                    <p className="text-xs text-slate-400">{x.student?.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {x.anomalous && <span className="rounded-full bg-red-50 px-2 py-1 font-bold text-red-600">⚠ device anomaly</span>}
                  <span className={`rounded-full px-3 py-1 font-bold capitalize ${x.status === 'present' ? 'bg-emerald-soft text-emerald2' : x.status === 'excused' ? 'bg-sky-50 text-sky-600' : x.status === 'absent' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    {x.status}
                  </span>
                  {x._id && !roster.session.closed && (
                    <>
                      <button onClick={() => act(() => client.patch(`/attendance/${x._id}/override`, { status: 'excused', reason: 'Manually excused by teacher' }), `${x.student?.name} excused`)}
                        className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 hover:border-sky-400 hover:text-sky-600">Excuse</button>
                      <button onClick={() => act(() => client.patch(`/attendance/${x._id}/override`, { status: 'absent', reason: 'Manually marked absent by teacher' }), `${x.student?.name} marked absent`)}
                        className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 hover:border-red-400 hover:text-red-600">Absent</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
