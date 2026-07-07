import React from 'react';
import EmptyState from './EmptyState';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto border-2 border-slate-800 rounded bg-white shadow-md">
      <table className="mil-table w-full border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`py-3 px-4 whitespace-nowrap ${className}`}>{children}</th>;
}
export function Td({ children, className = '', onClick }: { children?: React.ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLTableCellElement> }) {
  return <td className={`py-3 px-4 ${className}`} onClick={onClick}>{children}</td>;
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr>
        {children}
      </tr>
    </thead>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState message={message} />
      </td>
    </tr>
  );
}
