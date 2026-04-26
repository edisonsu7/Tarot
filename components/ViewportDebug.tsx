"use client";

import { useEffect, useState } from "react";

export function ViewportDebug() {
  const [w, setW] = useState<number | null>(null);
  const [dpr, setDpr] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      setW(window.innerWidth);
      setDpr(window.devicePixelRatio ?? 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (w === null) return null;

  return (
    <div className="fixed bottom-3 left-3 z-[9999] rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-indigo-50/90 backdrop-blur">
      w={w}px dpr={dpr}
    </div>
  );
}

