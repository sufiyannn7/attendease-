import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { ErrorState } from '../components/states.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function StudentCheckin() {
  const { sessionId } = useParams();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [myRequest, setMyRequest] = useState(null);

  useEffect(() => {
    client.get('/attendance-requests/mine')
      .then((r) => setMyRequest(r.data.find((x) => String(x.session?._id) === String(sessionId)) || null))
      .catch(() => {});
  }, [sessionId]);

  async function sendRequest() {
    const reason = window.prompt('Tell your teacher why (e.g. "was in the medical room"):');
    if (!reason || reason.trim().length < 3) return;
    try {
      await client.post(`/sessions/${sessionId}/request`, { reason: reason.trim() });
      toast('Request sent — your teacher will review it');
      const r = await client.get('/attendance-requests/mine');
      setMyRequest(r.data.find((x) => String(x.session?._id) === String(sessionId)) || null);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await client.post(`/sessions/${sessionId}/checkin`, { token: code.trim().toUpperCase() });
      setDone(r.data);
      toast(r.data.idempotent ? 'Already checked in from this device' : 'Checked in — see you next class!');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <h1 className="display text-3xl font-bold tracking-tight">Session check-in</h1>
        <p className="mt-1.5 text-pencil">Type the code on the classroom screen.</p>

        {!done ? (
          <form onSubmit={submit} className="card card-raise mt-8 p-7">
            {error && <p className="mb-4 rounded-xl border border-coral/35 bg-coral-soft px-3 py-2 text-sm font-semibold text-coral" role="alert">{error}</p>}
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength="12" autoFocus aria-label="check-in code"
              className="mono w-full rounded-2xl border-2 border-line bg-paper px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
            <button disabled={busy || code.length < 4} className="btn-primary mt-5 w-full rounded-xl py-3.5 font-bold disabled:opacity-40">
              {busy ? 'Verifying…' : 'Check in'}
            </button>
            <p className="mono mt-4 text-[10px] uppercase tracking-[0.25em] text-pencil">codes rotate every 60s — screenshots won’t work</p>
            <div className="mt-5 border-t border-dashed border-line pt-4">
              {myRequest ? (
                <p className={`pill px-3 py-1.5 ${myRequest.status === 'approved' ? 'bg-emerald-wash text-emerald-deep' : myRequest.status === 'rejected' ? 'bg-coral-soft text-coral' : 'bg-marker-soft text-[#8a6a10]'}`}>
                  your request: {myRequest.status}{myRequest.status === 'pending' ? ' — waiting for the teacher' : ''}
                </p>
              ) : (
                <button onClick={sendRequest} className="text-xs font-bold uppercase tracking-[0.2em] text-pencil underline decoration-dotted hover:text-emerald">
                  ✋ missed the code? request attendance
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="signal-card mt-8 p-9">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald/20 text-4xl text-emerald-300">✓</div>
            <h2 className="display mt-5 text-2xl font-bold text-white">You’re marked present</h2>
            <p className="mono mt-2 text-xs uppercase tracking-[0.3em] text-emerald-300/80">
              at {new Date(done.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
        <Link to="/courses" className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.3em] text-pencil hover:text-emerald">← my courses</Link>
      </main>
    </div>
  );
}
