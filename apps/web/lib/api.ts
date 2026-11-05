import "server-only";
import { NextResponse } from "next/server";
import { isAuthed } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function authed(): Promise<NextResponse | null> {
  return (await isAuthed()) ? null : fail("Not signed in", 401);
}
