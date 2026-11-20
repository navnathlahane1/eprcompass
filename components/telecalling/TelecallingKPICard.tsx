import type { ReactNode } from 'react';

interface TelecallingKPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function TelecallingKPICard({ label, value, sub, icon, trend }: TelecallingKPICardProps) {
  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {sub && (
        <div className={[
          'text-xs mt-1',
          trend === 'up' ? 'text-green-600' :
          trend === 'down' ? 'text-red-500' :
          'text-slate-400',
        ].join(' ')}>
          {sub}
        </div>
      )}
    </div>
  );
}
