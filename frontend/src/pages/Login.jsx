import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast(`Welcome, ${u?.name?.split(' ')[0] ?? 'back'}`);
      navigate('/courses');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-20 right-[-8rem] h-96 w-96 rounded-full bg-emerald/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-8rem] h-80 w-80 rounded-full bg-marker/15 blur-[110px]" />

      <div className="card card-raise tilt-card relative w-full max-w-md p-8 sm:p-10">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ink text-2xl font-bold text-marker shadow-[0_14px_28px_-10px_rgba(26,35,50,.5)]">✓</span>
          <h1 className="display mt-5 text-3xl font-bold tracking-tight">Class is in session</h1>
          <p className="mt-1.5 text-sm text-pencil">Log in to take attendance or check in</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <p className="rounded-xl border border-coral/35 bg-coral-soft px-4 py-2.5 text-sm font-semibold text-coral" role="alert">{error}</p>}
          {[['Email', 'email', 'email', form.email, (v) => setForm({ ...form, email: v })],
            ['Password', 'password', 'current-password', form.password, (v) => setForm({ ...form, password: v })]].map(([label, key, ac, val, set]) => (
            <label key={key} className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">{label}</span>
              <input type={key === 'email' ? 'email' : 'password'} value={val} onChange={(e) => set(e.target.value)} autoComplete={ac}
                className="mt-1.5 w-full rounded-xl border border-line bg-ivory px-4 py-3 outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
            </label>
          ))}
          <button disabled={busy} className="btn-primary w-full rounded-xl py-3.5 text-base font-bold disabled:opacity-70">{busy ? 'Checking…' : 'Log in'}</button>
          <p className="text-center text-sm text-pencil">New here? <Link to="/register" className="font-bold text-emerald-deep hover:underline">Create an account</Link></p>
        </form>
        <p className="mono mt-6 rounded-xl border border-dashed border-line bg-paper px-4 py-2.5 text-center text-[10px] tracking-wider text-pencil">
          DEMO · prof@demo.com (teacher) · aarav@demo.com (student) · Demo@1234
        </p>
      </div>
    </div>
  );
}
