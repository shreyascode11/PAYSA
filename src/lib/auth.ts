import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionSecret } from "./secret";

export const SESSION_COOKIE = "fs_session";
const SESSION_HOURS = 12;

export type Session =
  | { role: "worker"; sub: string; orgId: string }
  | { role: "admin"; sub: string; orgIds: string[] };

const key = (): Uint8Array => new TextEncoder().encode(sessionSecret());

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role === "worker" && typeof payload.sub === "string" && typeof payload.orgId === "string") {
      return { role: "worker", sub: payload.sub, orgId: payload.orgId };
    }
    if (payload.role === "admin" && typeof payload.sub === "string" && Array.isArray(payload.orgIds)) {
      return { role: "admin", sub: payload.sub, orgIds: payload.orgIds.filter((o): o is string => typeof o === "string") };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function getWorkerSession(): Promise<Extract<Session, { role: "worker" }> | null> {
  const s = await getSession();
  return s?.role === "worker" ? s : null;
}

export async function getAdminSession(): Promise<Extract<Session, { role: "admin" }> | null> {
  const s = await getSession();
  return s?.role === "admin" ? s : null;
}

/** For server pages: bounce to login instead of rendering. */
export async function requireWorkerPage() {
  const s = await getWorkerSession();
  if (!s) redirect("/w/login");
  return s;
}

export async function requireAdminPage() {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return s;
}
