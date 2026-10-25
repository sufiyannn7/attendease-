import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    if (form.name.trim().length < 2) return 'Enter your name (2+ characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return 'Password needs 8+ characters with a letter and a number.';
    if (role === 'student' && !form.rollNo.trim()) return 'Enter your roll number.';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), role, rollNo: form.rollNo.trim() });
      toast('Account ready');
      navigate('/courses');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-20 left-[-8rem] h-96 w-96 rounded-full bg-emerald/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-marker/15 blur-[110px]" />

      <div className="card card-raise tilt-card relative w-full max-w-md p-8 sm:p-10">
        <div className="text-center">
          <h1 className="display text-3xl font-bold tracking-tight">Join AttendEase</h1>
          <p className="mt-1.5 text-sm text-pencil">Teachers run sessions · students check in</p>
        </div>

        {/* role picker */}
        <div className="mt-7 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
          {[['teacher', '📚', 'Teacher', 'Run sessions, analytics'], ['student', '🎒', 'Student', 'Check in with codes']].map(([r, icon, label, sub]) => (
            <button type="button" key={r} onClick={() => setRole(r)} aria-pressed={role === r}
              className={`rounded-2xl border p-4 text-left transition ${role === r ? 'border-emerald/60 bg-emerald-wash shadow-[0_12px_28px_-14px_rgba(13,147,115,.5)]' : 'border-line bg-ivory hover:border-pencil/40'}`}>
              <span className="text-2xl">{icon}</span>
              <p className={`display mt-2 font-bold ${role === r ? 'text-emerald-deep' : ''}`}>{label}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-pencil">{sub}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <p className="rounded-xl border border-coral/35 bg-coral-soft px-4 py-2.5 text-sm font-semibold text-coral" role="alert">{error}</p>}
          {[['Name', 'name', 'name'], ...(role === 'student' ? [['Roll number', 'rollNo', 'off']] : []), ['Email', 'email', 'email'], ['Password', 'password', 'new-password']].map(([label, key, ac]) => (
            <label key={key} className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">{label}</span>
              <input type={key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'} value={form[key]} onChange={set(key)} autoComplete={ac}
                className="mt-1.5 w-full rounded-xl border border-line bg-ivory px-4 py-3 outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
            </label>
          ))}
          <button disabled={busy} className="btn-primary w-full rounded-xl py-3.5 text-base font-bold disabled:opacity-70">{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-center text-sm text-pencil">Have one? <Link to="/login" className="font-bold text-emerald-deep hover:underline">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
