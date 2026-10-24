export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="font-semibold text-red-700">Something went wrong</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
          Retry
        </button>
      )}
    </div>
  );
}
