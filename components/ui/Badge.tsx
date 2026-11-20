import type { ReactNode } from 'react';

type Variant = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const variantStyles: Record<Variant, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
};

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, variant = 'gray', dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
