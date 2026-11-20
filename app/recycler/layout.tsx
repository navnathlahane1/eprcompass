/**
 * /recycler/* is deprecated — all routes redirect to /recycler-portal/* via next.config.mjs.
 * This layout is a passthrough for any edge-case that isn't caught by the redirects.
 */
export default function RecyclerLegacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
