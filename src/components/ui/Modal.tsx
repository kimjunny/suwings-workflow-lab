import React from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, children, footer, width = 'max-w-2xl' }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onClick={onClose}>
      <div
        className={`win7-window w-full ${width} my-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="win7-titlebar flex items-center justify-between px-3 py-1.5 select-none">
          <span className="text-xs font-bold tracking-tight">{title}</span>
          <button onClick={onClose} className="win7-close-btn flex items-center justify-center cursor-pointer" aria-label="닫기">
            <X size={10} strokeWidth={3} />
          </button>
        </div>
        <div className="bg-[#f0f3f5] p-5 border-b border-slate-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 bg-[#e5ebf0] px-4 py-2 border-t border-white">{footer}</div>}
      </div>
    </div>
  );
}
