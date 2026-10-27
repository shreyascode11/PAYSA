import type { ReactNode } from "react";
import { Logo } from "../Logo";

interface Props {
  /** Small role chip in the header, e.g. "Worker pass". */
  kind: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Hide the strap on small layouts where several badges sit side by side. */
  strap?: boolean;
}

/** Lanyard ID badge: the PAYSA auth and identity surface (login, role picker, Skill Passport). */
export function IdBadge({ kind, children, footer, className = "", strap = true }: Props) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {strap && (
        <div aria-hidden="true" className="flex flex-col items-center">
          <span className="block h-16 w-9 rounded-b-sm bg-navy-900 shadow-inner ring-1 ring-ivory-50/10 sm:h-24" />
          <svg viewBox="0 0 40 46" className="-mt-1 h-12 w-10">
            <path d="M8 4h24a4 4 0 0 1 4 4v3a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9V8a4 4 0 0 1 4-4z" fill="none" stroke="var(--color-ivory-50)" strokeOpacity=".7" strokeWidth="3" />
            <rect x="16.5" y="19" width="7" height="12" rx="2" fill="var(--color-ivory-50)" fillOpacity=".7" />
            <path d="M20 30v6a5 5 0 1 1-5 5" fill="none" stroke="var(--color-ivory-50)" strokeOpacity=".7" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <article className="badge-sway relative w-full overflow-hidden rounded-[28px] bg-dusk text-ivory-50 shadow-2xl shadow-navy-950/60 ring-1 ring-ivory-50/12">
        <span aria-hidden="true" className="absolute left-1/2 top-3.5 h-3 w-14 -translate-x-1/2 rounded-full bg-navy-950 ring-1 ring-ivory-50/20" />
        <header className="flex items-center justify-between gap-3 px-6 pb-2 pt-9">
          <span className="flex items-center gap-2">
            <Logo className="size-9" />
            <span className="text-lg font-extrabold tracking-[0.18em]">PAYSA</span>
          </span>
          <span className="rounded-full bg-sand-300 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-navy-950">{kind}</span>
        </header>
        <div className="px-6 pb-6 pt-2">{children}</div>
        {footer && <footer className="flex items-center justify-between gap-3 border-t border-ivory-50/12 px-6 py-3 text-sm text-ivory-50/75">{footer}</footer>}
      </article>
    </div>
  );
}
