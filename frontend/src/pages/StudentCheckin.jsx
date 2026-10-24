import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function StudentCheckin() {
  const { sessionId } = useParams();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await client.post(`/sessions/${sessionId}/checkin`, { token: code.trim().toUpperCase() });
      setDone(r.data);
      toast(r.data.idempotent ? 'Already checked in from this device' : 'Checked in — see you next class!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Session check-in</h1>
        <p className="mt-1 text-slate-500">Type the code on the classroom screen.</p>
        {!done ? (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength="12" placeholder="ABC123DEF456" autoFocus
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] outline-none focus:border-emerald2" />
            <button disabled={busy || code.length < 4} className="w-full rounded-xl bg-emerald2 py-3 font-semibold text-white disabled:opacity-40">
              {busy ? 'Verifying…' : 'Check in'}
            </button>
            <p className="text-xs text-slate-400">Codes rotate every minute — a screenshot from your friend won't work.</p>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl border-2 border-emerald-200 bg-emerald-soft p-8">
            <p className="text-5xl">✓</p>
            <h2 className="mt-3 text-xl font-bold text-emerald2">You're marked present</h2>
            <p className="mt-2 text-sm text-slate-500">at {new Date(done.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )}
        <Link to="/courses" className="mt-6 inline-block text-sm font-semibold text-slate-400 hover:text-emerald2">← My courses</Link>
      </main>
    </div>
  );
}
