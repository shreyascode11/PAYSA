import { Search } from "lucide-react";

/** Plain GET form: works with JavaScript disabled or still loading on a slow phone. */
export function TrackForm({ label, button, defaultValue = "" }: { label: string; button: string; defaultValue?: string }) {
  return (
    <form action="/w/track" method="get" className="flex flex-col gap-2">
      <label htmlFor="track-code" className="text-xs font-bold uppercase tracking-[0.14em] text-cream-50/75">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="track-code"
          name="code"
          defaultValue={defaultValue}
          placeholder="PS-XXXXXX"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          required
          className="min-h-14 min-w-0 flex-1 rounded-2xl bg-cream-50/8 px-4 font-mono text-xl uppercase tracking-widest text-cream-50 ring-1 ring-cream-50/20 placeholder:text-cream-50/60 focus:outline-none focus:ring-2 focus:ring-safety-500"
        />
        <button type="submit" className="flex min-h-14 items-center gap-2 rounded-full bg-safety-500 px-5 text-lg font-extrabold text-ink-900">
          <Search aria-hidden="true" className="size-5" />
          {button}
        </button>
      </div>
    </form>
  );
}
