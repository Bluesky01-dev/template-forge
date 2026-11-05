import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "4rem 1rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Not found</h1>
      <p>This page doesn&apos;t exist (or the pitch was unpublished).</p>
      <Link href="/">Go home</Link>
    </main>
  );
}
