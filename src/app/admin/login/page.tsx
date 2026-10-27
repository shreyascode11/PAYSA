import { KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { IdBadge } from "@/components/ui/IdBadge";
import { DEMO } from "@/data/seed";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login" };

// The admin dashboard is English-only: it serves supervisors/HR on desktop.
export default async function AdminLogin() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <div lang="en" className="bg-aurora min-h-dvh text-cream-50">
      <main id="main" className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 pb-10">
        <IdBadge
          kind="Staff pass"
          footer={
            <>
              <span className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden="true" className="size-4" />
                HR &amp; supervisors
              </span>
              <span className="tabular">ID ••••</span>
            </>
          }
        >
          <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl">SUPERVISOR</h1>
          <p className="mb-5 mt-2 text-base text-cream-50/75">Sites, safety and people, in one place.</p>
          <LoginForm
            endpoint="/api/auth/admin-login"
            submitLabel="Log in"
            messages={{
              invalid: "Wrong email or password.",
              tooMany: "Too many attempts. Please wait a minute.",
              generic: "Something went wrong. Please try again.",
              offline: "You are offline.",
            }}
            fields={[
              { name: "email", label: "Work email", type: "email", inputMode: "email", autoComplete: "username" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
          />
        </IdBadge>
        <aside className="glass-dark rounded-3xl p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-cream-50/75">
            <KeyRound aria-hidden="true" className="size-4" /> Demo login
          </h2>
          <p className="tabular">
            {DEMO.adminEmail} / {DEMO.adminPassword}
          </p>
        </aside>
      </main>
    </div>
  );
}
