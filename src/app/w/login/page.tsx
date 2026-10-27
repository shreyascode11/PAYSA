import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkerLoginPanel } from "@/components/WorkerLoginPanel";
import { getWorkerSession } from "@/lib/auth";
import { getT } from "@/lib/locale";

export const metadata: Metadata = { title: "Worker login" };

export default async function WorkerLogin() {
  if (await getWorkerSession()) redirect("/w/home");
  const { lang, t } = await getT();
  return (
    <main id="main" className="flex-1 px-4 pb-10">
      <WorkerLoginPanel lang={lang} t={t} />
    </main>
  );
}
