// apps/web/src/hooks/useLastSync.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export function useLastSync() {
  const [ts, setTs] = useState<number>(() => Date.now());

  useEffect(() => {
    // demo: mỗi khi refresh thì xem như "đồng bộ"
    setTs(Date.now());
  }, []);

  return useMemo(() => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    return `${hh}:${mm} • ${dd}/${mo}`;
  }, [ts]);
}