"use client";

import { useEffect } from "react";

export function MouseGlow() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const x = Math.round((e.clientX / window.innerWidth) * 1000) / 10;
        const y = Math.round((e.clientY / window.innerHeight) * 1000) / 10;
        root.style.setProperty("--mx", `${x}%`);
        root.style.setProperty("--my", `${y}%`);
      });
    };

    // Only enable on fine pointers (desktop-ish)
    const fine = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
    if (!fine) return;

    root.style.setProperty("--mx", "70%");
    root.style.setProperty("--my", "18%");
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

