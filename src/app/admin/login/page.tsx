import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO } from "@/data/seed";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login" };

// The admin dashboard is English-only: it serves supervisors/HR on desktop.
export default async function AdminLogin() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main id="main" lang="en" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <p className="text-xl font-extrabold text-brand">FairShift · Admin</p>
      <h1 className="mb-6 mt-1 text-3xl font-extrabold">Supervisor / HR login</h1>
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
          { name: "email", label: "Email", type: "email", inputMode: "email", autoComplete: "username" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 rounded-xl bg-surface-2 p-4 text-base text-muted">
        Demo: {DEMO.adminEmail} / {DEMO.adminPassword}
      </p>
    </main>
  );
}
