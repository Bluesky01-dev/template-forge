"use client";

import { useEffect } from "react";

/**
 * Runs inside the editor's preview iframe. Alt/Option-click (or any click when the
 * parent enabled "select mode") posts the clicked section id to the editor, and
 * highlights sections on hover so the user can point the AI at "this" section.
 */
export function SectionPicker() {
  useEffect(() => {
    if (window.parent === window) return;
    let selectMode = false;
    const style = document.createElement("style");
    style.textContent = `.tf-hover{outline:2px dashed var(--tf-ring);outline-offset:-2px;cursor:crosshair}.tf-selected{outline:3px solid var(--tf-ring);outline-offset:-3px}`;
    document.head.appendChild(style);

    const sectionOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-section]") : null);
    const onMove = (e: MouseEvent) => {
      document.querySelectorAll(".tf-hover").forEach((el) => el.classList.remove("tf-hover"));
      if (selectMode || e.altKey) sectionOf(e.target)?.classList.add("tf-hover");
    };
    const onClick = (e: MouseEvent) => {
      const s = sectionOf(e.target);
      if (!s || !(selectMode || e.altKey)) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".tf-selected").forEach((el) => el.classList.remove("tf-selected"));
      s.classList.add("tf-selected");
      window.parent.postMessage({ type: "tf:select", sectionId: s.dataset.section }, window.location.origin);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "tf:select-mode") selectMode = !!e.data.on;
      if (e.data?.type === "tf:clear-selection") document.querySelectorAll(".tf-selected").forEach((el) => el.classList.remove("tf-selected"));
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "tf:ready" }, window.location.origin);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      style.remove();
    };
  }, []);
  return null;
}
