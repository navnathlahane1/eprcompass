export default function TourTarget({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-tour-id={id} className={className}>
      {children}
    </div>
  );
}
