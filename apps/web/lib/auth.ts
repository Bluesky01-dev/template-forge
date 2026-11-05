import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSecrets } from "./env";

const COOKIE = "tf_session";

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie holds a hash of the password, so rotating APP_PASSWORD logs everyone out. */
export async function sessionToken(password: string) {
  return sha256(`template-forge:${password}`);
}

export async function isAuthed(): Promise<boolean> {
  const { appPassword } = await getSecrets();
  if (!appPassword) return true; // no password configured → open (local dev)
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && c === (await sessionToken(appPassword));
}

export async function requireAuth() {
  if (!(await isAuthed())) redirect("/login");
}

export async function login(password: string): Promise<boolean> {
  const { appPassword } = await getSecrets();
  if (!appPassword || password !== appPassword) return false;
  (await cookies()).set(COOKIE, await sessionToken(appPassword), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
