import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "brand" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand text-brand-ink",
  danger: "bg-danger text-danger-ink",
  neutral: "bg-surface text-ink border-2 border-line",
};

interface CommonProps {
  label: string;
  sublabel?: string;
  icon: ReactNode;
  tone?: Tone;
  className?: string;
}

type Props = CommonProps &
  ({ href: string } | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">));

/** Large icon + word action: the primary interaction pattern of the worker app. */
export function BigButton(props: Props) {
  const { label, sublabel, icon, tone = "brand", className = "" } = props;
  const cls = `flex min-h-16 w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-xl font-bold shadow-sm transition active:scale-[0.99] disabled:opacity-60 ${TONES[tone]} ${className}`;
  const body = (
    <>
      <span aria-hidden="true" className="shrink-0 [&>svg]:size-8">
        {icon}
      </span>
      <span className="flex flex-col">
        <span>{label}</span>
        {sublabel && <span className="text-base font-normal opacity-90">{sublabel}</span>}
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
  const { label: _l, sublabel: _s, icon: _i, tone: _t, className: _c, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} className={cls} {...rest}>
      {body}
    </button>
  );
}
