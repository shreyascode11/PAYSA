import type { Metadata } from "next";
import { NoticeForm } from "@/components/admin/NoticeForm";
import { aiEnabled } from "@/lib/ai/gemini";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { formatDateTime } from "@/lib/i18n";

export const metadata: Metadata = { title: "Notices" };

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" } as const;

export default async function Notices() {
  const { org } = await adminPageContext();
  const notices = await getRepo().listAnnouncements(org.id);
  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold">Daily notices</h1>
      <p className="mb-4 text-navy-950/70">Short notices appear on every worker&apos;s home screen with a Listen button.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <NoticeForm orgId={org.id} autoTranslate={aiEnabled()} />
        <section aria-labelledby="posted">
          <h2 id="posted" className="mb-3 text-lg font-bold">
            Posted
          </h2>
          <ul className="flex flex-col gap-3">
            {notices.map((n) => (
              <li key={n.id} className="rounded-3xl border-l-4 border-slate-600 bg-ivory-50 p-5">
                <p lang={n.lang}>{n.text}</p>
                <p className="mt-1 text-sm text-navy-950/70">
                  {LANG_NAMES[n.lang]} · also in {Object.keys(n.translations ?? {}).filter((l) => l !== n.lang).map((l) => LANG_NAMES[l as keyof typeof LANG_NAMES]).join(", ") || "no other language"} · {formatDateTime(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
