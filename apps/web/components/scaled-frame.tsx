/** A live, scaled-down iframe preview of a full-width page. */
export function ScaledFrame({ src, title, scale = 0.32, height = 300 }: { src: string; title: string; scale?: number; height?: number }) {
  const width = 1280;
  return (
    <div className="relative w-full overflow-hidden rounded-tf border border-border bg-muted" style={{ height }}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width, height: height / scale, transform: `scale(${scale})` }}
      />
    </div>
  );
}
