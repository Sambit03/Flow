'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, opts?: { description?: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_STYLES: Record<ToastType, { border: string; icon: string; color: string }> = {
  success: { border: 'border-l-[#3FB950]', icon: '✓', color: 'text-[#3FB950]' },
  error:   { border: 'border-l-[#F85149]', icon: '✕', color: 'text-[#F85149]' },
  info:    { border: 'border-l-[#388BFD]', icon: 'i', color: 'text-[#388BFD]' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = TYPE_STYLES[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-lg border border-[#30363D]',
        'bg-[#161B22] shadow-[0_8px_24px_rgba(0,0,0,0.7)]',
        'border-l-4 animate-slide-in min-w-[280px] max-w-[360px]',
        style.border,
      ].join(' ')}
    >
      <span className={`text-sm font-mono font-semibold mt-0.5 ${style.color}`}>{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#E6EDF3]">{toast.message}</p>
        {toast.description && <p className="text-xs text-[#8B949E] mt-0.5">{toast.description}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[#484F58] hover:text-[#8B949E] text-xs transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, opts?: { description?: string; type?: ToastType }) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, description: opts?.description, type: opts?.type ?? 'info' }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
