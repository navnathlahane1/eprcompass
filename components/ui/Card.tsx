import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
}

export default function Card({ children, padding = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${padding ? 'p-5 md:p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 ${className}`}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
