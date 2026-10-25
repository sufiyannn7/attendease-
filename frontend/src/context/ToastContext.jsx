import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-[0_20px_44px_-16px_rgba(26,35,50,.35)] backdrop-blur-md ${t.type === 'error' ? 'border-coral/40 bg-coral-soft text-coral' : t.type === 'info' ? 'border-marker/50 bg-marker-soft text-[#8a6a10]' : 'border-emerald/30 bg-emerald-wash text-emerald-deep'}`}
            style={{ animation: 'fadeUp .4s cubic-bezier(.2,.7,.3,1) both' }}>
            <span className="text-base">{t.type === 'error' ? '⚠' : t.type === 'info' ? 'ℹ' : '✓'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
