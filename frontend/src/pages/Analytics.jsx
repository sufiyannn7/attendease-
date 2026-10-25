import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Analytics() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [defaulters, setDefaulters] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/courses/${id}/analytics`).then((r) => setData(r.data)).catch((err) => setError(err.message));
    if (user?.role === 'teacher') {
      client.get(`/courses/${id}/defaulters`).then((r) => setDefaulters(r.data)).catch(() => {});
    }
  }, [id, user]);

  if (error) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={() => window.location.reload()} /></main></div>;
  if (!data) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-16"><div className="shimmer h-96" /></main></div>;

  const maxRatio = Math.max(...data.heatmap.map((h) => h.ratio), 1);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/courses" className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-pencil hover:text-emerald">← courses</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-3xl font-bold tracking-tight">{user?.role === 'teacher' ? 'Course analytics' : 'My attendance'}</h1>
          {user?.role === 'teacher' && (
            <a href={`${client.defaults.baseURL}/courses/${id}/export.csv`} target="_blank" rel="noreferrer"
              className="btn-marker rounded-full px-5 py-2.5 text-sm font-bold">⬇ Export CSV</a>
          )}
        </div>
        <p className="mono mt-1 text-xs uppercase tracking-[0.2em] text-pencil">
          {data.sessions} sessions · {data.closedSessions} closed · {data.anomalies} device anomal{data.anomalies === 1 ? 'y' : 'ies'}
        </p>

        {/* punch-card heatmap */}
        <section className="card paper-edge mt-6 p-6">
          <h2 className="display font-bold">Session heatmap</h2>
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-8">
            {data.heatmap.map((h) => {
              const tone = h.ratio >= 80 ? 'bg-emerald text-white' : h.ratio >= 50 ? 'bg-marker text-[#4a3600]' : 'bg-coral text-white';
              return (
                <div key={String(h.sessionId)} className={`punch-hole rounded-xl ${tone} p-2.5 text-center`} title={h.topic}>
                  <p className="mono text-sm font-bold">{h.present}/{h.total}</p>
                  <p className="text-[9px] font-semibold opacity-80">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* defaulter radar */}
        {defaulters && defaulters.defaulters.length > 0 && (
          <section className="mt-6 rounded-[22px] border-2 border-coral/30 bg-coral-soft p-6">
            <div className="flex items-center justify-between">
              <h2 className="display font-bold text-coral">⚠ Defaulter radar — below {defaulters.threshold}%</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {defaulters.defaulters.map((d, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ivory px-4 py-3 text-sm shadow-sm">
                  <span><strong>{d.student?.name}</strong> <span className="mono text-xs text-pencil">{d.student?.rollNo}</span></span>
                  <span className="flex items-center gap-2">
                    <span className={`pill px-2.5 py-1 ${d.risk === 'critical' ? 'bg-coral text-white' : d.risk === 'high' ? 'bg-coral/20 text-coral' : 'bg-marker-soft text-[#8a6a10]'}`}>{d.risk}</span>
                    <span className="font-bold text-coral">{d.percent}%</span>
                    <span className="text-xs text-pencil">needs {d.deficitTo75} more</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* per-student table */}
        {user?.role === 'teacher' && (
          <section className="card mt-6 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-[10px] uppercase tracking-[0.2em] text-pencil">
                <tr><th className="px-5 py-3.5">Student</th><th className="px-5 py-3.5">P / E / A</th><th className="px-5 py-3.5">Attendance</th></tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.perStudent.map((p, i) => (
                  <tr key={i} className="transition hover:bg-paper">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{p.student?.name}</p>
                      <p className="mono text-[10px] text-pencil">{p.student?.rollNo}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{p.present} / {p.excused} / {p.absent}</td>
                    <td className="px-5 py-3.5">
                      <span className={`pill px-3 py-1 ${p.warning ? 'bg-coral-soft text-coral' : 'bg-emerald-wash text-emerald-deep'}`}>
                        {p.percent === null ? '—' : `${p.percent}%`}{p.warning ? ' · below 75%' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
