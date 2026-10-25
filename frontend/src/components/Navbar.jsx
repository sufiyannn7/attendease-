import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/courses" className="group flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lg font-bold text-marker shadow-[0_10px_22px_-8px_rgba(26,35,50,.5)] transition group-hover:rotate-[-4deg]">✓</span>
          <span className="display text-xl font-bold tracking-tight">Attend<span className="text-emerald">Ease</span></span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm font-semibold">
          <NavLink to="/courses" className={({ isActive }) => `rounded-full px-4 py-2 transition ${isActive ? 'bg-emerald-wash text-emerald-deep' : 'text-ink-soft hover:bg-black/5 hover:text-ink'}`}>Courses</NavLink>
          {user ? (
            <>
              <span className="chip hidden border border-line bg-ivory px-3 py-1.5 text-ink-soft md:block">{user?.name} · {user?.role}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost rounded-full px-4 py-2">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-ink-soft hover:text-ink">Log in</Link>
              <Link to="/register" className="btn-primary rounded-full px-5 py-2 font-bold">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
