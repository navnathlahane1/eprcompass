import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from 'react';

/* ---------- Root ---------- */
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export default function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className={`min-w-full divide-y divide-gray-200 text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Thead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <thead className={`bg-gray-50 ${className}`}>{children}</thead>;
}

function Tbody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-gray-100 bg-white ${className}`}>{children}</tbody>;
}

function Tr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`transition hover:bg-gray-50 ${className}`}>{children}</tr>;
}

function Th({ children, className = '', ...props }: { children: ReactNode } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '', ...props }: { children: ReactNode } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 text-gray-700 ${className}`} {...props}>
      {children}
    </td>
  );
}

function Empty({ message = 'No records found.', colSpan = 1 }: { message?: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  );
}

Table.Thead = Thead;
Table.Tbody = Tbody;
Table.Tr = Tr;
Table.Th = Th;
Table.Td = Td;
Table.Empty = Empty;
