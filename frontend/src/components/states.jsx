export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16" role="status" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <p className="mono text-[11px] font-semibold uppercase tracking-[0.3em] text-pencil">{label}</p>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-ivory/70 px-8 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-marker-soft text-2xl">📋</div>
      <p className="display text-lg font-bold">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-sm text-sm text-pencil">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-coral/35 bg-coral-soft px-8 py-10 text-center" role="alert">
      <p className="display font-bold text-coral">Something went wrong</p>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-ghost mt-5 rounded-full px-6 py-2 text-sm font-semibold">Retry</button>}
    </div>
  );
}
