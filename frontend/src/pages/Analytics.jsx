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
  if (!data) return <div className="min-h-screen"><Navbar /><Loading label="Crunching attendance…" /></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/courses" className="text-sm text-slate-400 hover:text-emerald2">← Courses</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{user?.role === 'teacher' ? 'Course analytics' : 'My attendance'}</h1>
          {user?.role === 'teacher' && (
            <a href={`${client.defaults.baseURL}/courses/${id}/export.csv`} target="_blank" rel="noreferrer"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:border-emerald2 hover:text-emerald2">Export CSV</a>
          )}
        </div>
        <p className="text-slate-500">{data.sessions} sessions · {data.closedSessions} closed · {data.anomalies} device anomal{data.anomalies === 1 ? 'y' : 'ies'}</p>

        {defaulters && defaulters.defaulters.length > 0 && (
          <section className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-700">⚠️ Defaulter radar — below {defaulters.threshold}%</h2>
            <ul className="mt-3 space-y-2">
              {defaulters.defaulters.map((d, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm">
                  <span><strong>{d.student?.name}</strong> <span className="text-slate-400">{d.student?.rollNo}</span></span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${d.risk === 'critical' ? 'bg-red-600 text-white' : d.risk === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{d.risk}</span>
                    <span className="font-bold text-red-700">{d.percent}%</span>
                    <span className="text-xs text-slate-400">needs {d.deficitTo75} more</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {user?.role === 'teacher' && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">P / E / A</th><th className="px-4 py-3">Attendance</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.perStudent.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.student?.name}</p>
                      <p className="text-xs text-slate-400">{p.student?.rollNo}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.present} / {p.excused} / {p.absent}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.warning ? 'bg-red-50 text-red-600' : 'bg-emerald-soft text-emerald2'}`}>
                        {p.percent === null ? '—' : `${p.percent}%`}{p.warning ? ' · below 75%' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Session heatmap</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.heatmap.map((h) => (
              <div key={String(h.sessionId)} className={`rounded-xl p-3 text-center text-xs ${h.ratio >= 80 ? 'bg-emerald-soft text-emerald2' : h.ratio >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                <p className="font-bold">{h.present}/{h.total}</p>
                <p className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                <p className="text-[10px]">{h.topic}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
