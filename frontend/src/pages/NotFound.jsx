import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute -top-24 right-[-8rem] h-96 w-96 rounded-full bg-emerald/10 blur-[110px]" />
      <div className="perspective"><p className="display float-3d text-8xl font-bold text-ink sm:text-9xl">404</p></div>
      <h1 className="display text-xl font-bold">Absent without leave</h1>
      <p className="max-w-sm text-pencil">The page you’re looking for isn’t on today’s roster.</p>
      <Link to="/courses" className="btn-primary rounded-full px-8 py-3 font-bold">Back to courses</Link>
    </div>
  );
}
