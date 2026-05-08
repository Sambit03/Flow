'use client';

import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,11,17,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={[
          'w-full rounded-xl border border-[#30363D] bg-[#161B22]',
          'shadow-[0_16px_48px_rgba(0,0,0,0.8)]',
          'animate-fade-in-up',
          width,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262D]">
            <h2 className="text-base font-semibold text-[#E6EDF3]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#484F58] hover:text-[#E6EDF3] transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
