import { Search } from "lucide-react";

/** Plain GET form: works with JavaScript disabled or still loading on a slow phone. */
export function TrackForm({ label, button, defaultValue = "" }: { label: string; button: string; defaultValue?: string }) {
  return (
    <form action="/w/track" method="get" className="flex flex-col gap-2">
      <label htmlFor="track-code" className="text-lg font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="track-code"
          name="code"
          defaultValue={defaultValue}
          placeholder="FS-XXXXXX"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          required
          className="min-h-14 min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-4 font-mono text-xl uppercase tracking-widest text-ink"
        />
        <button type="submit" className="flex min-h-14 items-center gap-2 rounded-xl bg-brand px-4 text-lg font-bold text-brand-ink">
          <Search aria-hidden="true" className="size-6" />
          {button}
        </button>
      </div>
    </form>
  );
}
