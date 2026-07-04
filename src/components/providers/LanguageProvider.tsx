"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import enMessages from "@/messages/en.json";
import faMessages from "@/messages/fa.json";

type Lang = "en" | "fa";
type Messages = Record<string, string>;

// The i18n catalogs. en.json is the source of truth; fa.json is produced by the
// token-efficient Gemini translation pipeline (JSON-in -> JSON-out) and reviewed by the
// Farsi agents. t() falls back to EN for any key the FA catalog hasn't filled yet.
const CATALOGS: Record<Lang, Messages> = {
  en: enMessages as Messages,
  fa: faMessages as Messages,
};

interface LangCtx {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<LangCtx>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  toggle: () => {},
  t: (key, fallback) => fallback ?? key,
});
export const useLang = () => useContext(Ctx);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "en" || saved === "fa") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  }, []);

  const dir: "ltr" | "rtl" = lang === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    const el = document.documentElement;
    el.dir = dir;
    el.lang = lang;
    el.classList.toggle("font-fa", lang === "fa");
  }, [dir, lang]);

  const toggle = useCallback(() => setLang(lang === "fa" ? "en" : "fa"), [lang, setLang]);

  const t = useCallback(
    (key: string, fallback?: string) => CATALOGS[lang]?.[key] ?? CATALOGS.en[key] ?? fallback ?? key,
    [lang]
  );

  return <Ctx.Provider value={{ lang, dir, setLang, toggle, t }}>{children}</Ctx.Provider>;
}
