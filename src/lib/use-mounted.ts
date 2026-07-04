"use client";

import { useEffect, useState } from "react";

/** True after the first client paint — use before reading localStorage / persisted Zustand. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
