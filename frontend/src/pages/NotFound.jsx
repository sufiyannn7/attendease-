import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-emerald2">404</p>
      <h1 className="text-xl font-bold">Absent without leave</h1>
      <p className="text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/courses" className="rounded-full bg-emerald2 px-6 py-2.5 font-semibold text-white">Back to courses</Link>
    </div>
  );
}
