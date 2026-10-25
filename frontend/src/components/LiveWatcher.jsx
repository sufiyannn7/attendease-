import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Watches for live sessions across the student's enrolled courses.
// Shows a floating alert bar + navbar badge when a class is happening NOW.
export default function LiveWatcher() {
  const { user } = useAuth();
  const [live, setLive] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ae_live_dismissed') || '[]'); } catch { return []; }
  });
  const prevCount = useRef(0);
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (!isStudent) return;
    const poll = () => client.get('/my/live-sessions')
      .then((r) => {
        setLive(r.data);
        if (r.data.length > prevCount.current) {
          // new session just started — clear dismissals
          setDismissed([]);
          sessionStorage.removeItem('ae_live_dismissed');
        }
        prevCount.current = r.data.length;
      })
      .catch(() => {});
    poll();
    const t = setInterval(poll, 8000);
    return () => clearInterval(t);
  }, [isStudent]);

  if (!isStudent || live.length === 0) return null;

  const visible = live.filter((s) => !dismissed.includes(s._id));
  if (visible.length === 0) return null;

  return (
    <div className="sticky top-16 z-30 mx-auto max-w-5xl px-4 pt-3">
      {visible.map((s) => (
        <div key={s._id} className="flex items-center gap-4 rounded-2xl border-2 border-emerald/40 bg-emerald-wash px-5 py-3 shadow-[0_14px_34px_-14px_rgba(13,147,115,.4)] backdrop-blur-md"
          style={{ animation: 'fadeUp .5s cubic-bezier(.2,.7,.3,1) both' }}>
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
            <span className="h-3 w-3 rounded-full bg-emerald" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-deep">
              {s.courseCode} — {s.courseName} is LIVE right now
            </p>
            <p className="text-xs text-emerald-deep/70">{s.topic} · started {new Date(s.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <Link to={`/checkin/${s._id}`} className="btn-primary shrink-0 rounded-full px-5 py-2 text-xs font-bold">
            Check in now →
          </Link>
          <button onClick={() => { const d = [...dismissed, s._id]; setDismissed(d); sessionStorage.setItem('ae_live_dismissed', JSON.stringify(d)); }}
            aria-label="dismiss" className="shrink-0 text-emerald-deep/40 hover:text-emerald-deep">✕</button>
        </div>
      ))}
    </div>
  );
}
