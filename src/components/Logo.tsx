/**
 * PAYSA mascot mark: a site worker in a hard hat and shades, on a cream tile so it reads on
 * both the dark worker UI and the cream admin UI. Decorative: the wordmark beside it is the name.
 */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
      <rect width="64" height="64" rx="16" fill="var(--color-cream-50)" />
      <MascotPaths />
    </svg>
  );
}

/** The bare mascot (no tile), for large brand moments such as the login badge. */
export function Mascot({ className = "size-24" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="8 6 48 54" className={className}>
      <MascotPaths />
    </svg>
  );
}

function MascotPaths() {
  return (
    <>
      {/* hard hat: dome with two ridge cut-outs, then the brim */}
      <path d="M17 26c0-8.6 6.7-15 15-15s15 6.4 15 15z" fill="var(--color-warn)" />
      <path d="M26.5 12.6 28.6 25M37.5 12.6 35.4 25" stroke="var(--color-cream-50)" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="13" y="24.5" width="38" height="5" rx="2.5" fill="var(--color-warn)" />
      {/* beard: shield shape with cheek notches, leaving the face as negative space */}
      <path d="M16.5 32.5h4.2l3.2 7.3h16.2l3.2-7.3h4.2V47L32 58 16.5 47z" fill="var(--color-ink-900)" />
      {/* mouth cut into the beard */}
      <path d="M27.4 49.5 29.4 45h5.2l2 4.5h-2.3L33 47.2h-2l-1.3 2.3z" fill="var(--color-cream-50)" />
      {/* shades */}
      <path d="M17.5 31.5h12.2l-1.1 5.1a2.6 2.6 0 0 1-2.5 2H21a2.6 2.6 0 0 1-2.5-2zM34.3 31.5h12.2l-1 5.1a2.6 2.6 0 0 1-2.5 2h-4.6a2.6 2.6 0 0 1-2.5-2z" fill="var(--color-ink-900)" stroke="var(--color-cream-50)" strokeWidth="1.4" paintOrder="stroke" />
      <rect x="28.5" y="31.5" width="7" height="2.2" rx="1" fill="var(--color-ink-900)" />
    </>
  );
}
