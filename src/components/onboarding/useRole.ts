"use client";

// Tiny localStorage helper — deliberately NOT touching store.ts.
// Key: "raouf.role"   Value: one of Audience ids from @/lib/competencies

import { useState, useEffect } from "react";
import type { Audience } from "@/lib/competencies";

const ROLE_KEY = "raouf.role";

export function getStoredRole(): Audience | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(ROLE_KEY);
  return v as Audience | null;
}

export function setStoredRole(role: Audience): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
}

/** React hook — returns [role, setRole]. Null while not yet determined. */
export function useRole(): [Audience | null, (r: Audience) => void] {
  const [role, setRoleState] = useState<Audience | null>(null);

  useEffect(() => {
    setRoleState(getStoredRole());
  }, []);

  const setRole = (r: Audience) => {
    setStoredRole(r);
    setRoleState(r);
  };

  return [role, setRole];
}
