import React from 'react';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold text-slate-950 uppercase tracking-wider">{children}</label>;
}

const base =
  'border border-slate-500 p-2 text-sm bg-white text-slate-950 w-full disabled:bg-slate-200 font-bold';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} ${props.className ?? ''}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />;
}

export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
