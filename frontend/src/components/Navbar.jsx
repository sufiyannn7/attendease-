import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <NavLink to="/courses" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald2 text-sm text-white">✓</span>
          AttendEase
        </NavLink>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <NavLink to="/courses" className={({ isActive }) => `rounded-full px-3 py-2 ${isActive ? 'bg-emerald-soft text-emerald2' : 'text-slate-500 hover:text-slate-800'}`}>Courses</NavLink>
          {user ? (
            <>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 md:block">{user.name} · {user.role}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="ml-1 rounded-full border border-slate-200 px-4 py-1.5 text-slate-600 hover:border-emerald2 hover:text-emerald2">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-full px-3 py-2 text-slate-500 hover:text-slate-800">Log in</NavLink>
              <NavLink to="/register" className="rounded-full bg-emerald2 px-4 py-2 text-white">Get started</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
