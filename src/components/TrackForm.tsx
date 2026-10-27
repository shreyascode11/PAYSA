import { Search } from "lucide-react";

/** Plain GET form: works with JavaScript disabled or still loading on a slow phone. */
export function TrackForm({ label, button, defaultValue = "" }: { label: string; button: string; defaultValue?: string }) {
  return (
    <form action="/w/track" method="get" className="flex flex-col gap-2">
      <label htmlFor="track-code" className="text-xs font-bold uppercase tracking-[0.14em] text-ivory-50/75">
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
          className="min-h-13 min-w-0 flex-1 rounded-2xl bg-ivory-50/8 px-4 font-mono text-lg uppercase tracking-widest text-ivory-50 ring-1 ring-ivory-50/20 placeholder:text-ivory-50/60 focus:outline-none focus:ring-2 focus:ring-sand-300"
        />
        <button type="submit" className="flex min-h-13 items-center gap-2 rounded-full bg-sand-300 px-5 text-base font-bold text-navy-950">
          <Search aria-hidden="true" className="size-5" />
          {button}
        </button>
      </div>
    </form>
  );
}
