"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("theme")) as Theme | null;
    if (saved === "dark" || saved === "light") setThemeState(saved);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("theme", t); } catch {}
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("light", theme === "light");
    el.classList.toggle("dark", theme === "dark");
    el.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}
