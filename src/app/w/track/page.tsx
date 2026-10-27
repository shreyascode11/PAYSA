import { redirect } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackForm } from "@/components/TrackForm";
import { getT } from "@/lib/locale";
import { normalizeTrackingId } from "@/lib/rules/anonymity";

export default async function TrackLookup({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (code?.trim()) redirect(`/w/report/${encodeURIComponent(normalizeTrackingId(code))}`);
  const { lang, t } = await getT();
  return (
    <main id="main" className="flex-1 px-4 py-6">
      <ScreenHeader title={t("track.title")} speak={t("track.enter")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <TrackForm label={t("track.enter")} button={t("track.check")} />
    </main>
  );
}
