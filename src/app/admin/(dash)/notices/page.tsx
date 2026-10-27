import type { Metadata } from "next";
import { NoticeForm } from "@/components/admin/NoticeForm";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";

export const metadata: Metadata = { title: "Notices" };

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" } as const;

export default async function Notices() {
  const { org } = await adminPageContext();
  const notices = await getRepo().listAnnouncements(org.id);
  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Daily notices</h1>
      <p className="mb-4 text-muted">Short notices appear on every worker&apos;s home screen with a Listen button.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <NoticeForm orgId={org.id} />
        <section aria-labelledby="posted">
          <h2 id="posted" className="mb-3 text-lg font-bold">
            Posted
          </h2>
          <ul className="flex flex-col gap-3">
            {notices.map((n) => (
              <li key={n.id} className="rounded-2xl border-l-4 border-brand bg-surface p-4">
                <p lang={n.lang}>{n.text}</p>
                <p className="mt-1 text-sm text-muted">
                  {LANG_NAMES[n.lang]} · {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
