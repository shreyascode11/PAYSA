import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type BigButtonVariant = "primary" | "secondary" | "light" | "outline";

// Orange is only ever a fill with ink content (CLAUDE.md §18.2).
const VARIANTS: Record<BigButtonVariant, string> = {
  primary: "bg-safety-500 text-ink-900",
  secondary: "bg-forest-700 text-cream-50",
  light: "bg-forest-900 text-cream-50",
  outline: "border-2 border-cream-50/45 text-cream-50",
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
  const cls = `flex min-h-16 w-full items-center gap-4 rounded-full px-6 py-3 text-left text-xl font-extrabold transition active:scale-[0.99] disabled:opacity-60 ${VARIANTS[variant]} ${className}`;
  const body = (
    <>
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-900/10 [&>svg]:size-7">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span>{label}</span>
        {sublabel && <span className="text-base font-semibold opacity-80">{sublabel}</span>}
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
