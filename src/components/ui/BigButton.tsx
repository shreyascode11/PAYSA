import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type BigButtonVariant = "primary" | "secondary" | "light" | "outline";

// Sand is only ever a fill with navy content (CLAUDE.md §18.2).
const VARIANTS: Record<BigButtonVariant, string> = {
  primary: "bg-sand-300 text-navy-950",
  secondary: "bg-slate-600 text-ivory-50",
  light: "bg-navy-950 text-ivory-50",
  outline: "border-2 border-ivory-50/45 text-ivory-50",
};

interface CommonProps {
  label: string;
  sublabel?: string;
  icon: ReactNode;
  variant?: BigButtonVariant;
  className?: string;
}

type Props = CommonProps &
  ({ href: string } | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">));

/** Large icon + word action: the single primary interaction on a worker screen. */
export function BigButton(props: Props) {
  const { label, sublabel, icon, variant = "primary", className = "" } = props;
  const cls = `flex min-h-14 w-full items-center gap-3 rounded-full px-5 py-2.5 text-left text-lg font-bold transition active:scale-[0.99] disabled:opacity-60 ${VARIANTS[variant]} ${className}`;
  const body = (
    <>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-950/10 [&>svg]:size-5">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span>{label}</span>
        {sublabel && <span className="text-sm font-medium opacity-80">{sublabel}</span>}
      </span>
    </>
  );
  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {body}
      </Link>
    );
  }
  const { label: _l, sublabel: _s, icon: _i, variant: _v, className: _c, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} className={cls} {...rest}>
      {body}
    </button>
  );
}
