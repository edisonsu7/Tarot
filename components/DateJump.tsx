"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DateJump() {
  const router = useRouter();
  const today = useMemo(() => formatDateKey(new Date()), []);
  const [value, setValue] = useState(today);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-indigo-100/60">查看某天</span>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-indigo-50 outline-none ring-indigo-400/40 focus:ring-2"
        />
      </label>

      <button
        type="button"
        onClick={() => router.push(`/day/${value}`)}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10 transition hover:bg-indigo-400"
      >
        查看
      </button>

      <button
        type="button"
        onClick={() => {
          setValue(today);
          router.push("/");
        }}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-indigo-50/90 transition hover:bg-white/10"
      >
        回到今天
      </button>
    </div>
  );
}

