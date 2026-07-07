"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  GraduationCap,
  Shield,
  Command,
  Languages,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useLang } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { useState } from "react";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";

// Top nav = the journey spine only. Device Lab / Clinical Simulator / Evidence / Flipbook
// are NOT tabs — they live inside each competency's journey (My Path → /learn/[id]).
const NAV = [
  { href: "/", labelKey: "nav.home", label: "Home", icon: Home },
  { href: "/my-path", labelKey: "nav.myPath", label: "My Path", icon: Compass },
  { href: "/assessment", labelKey: "nav.assess", label: "Assess & Certify", icon: GraduationCap },
  { href: "/admin", labelKey: "nav.admin", label: "Admin", icon: Shield },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);
  const mounted = useMounted();
  const streak = usePlatformStore((s) => s.streak);
  const { lang, toggle: toggleLang, t } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <div className="mesh-bg" aria-hidden />
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center" aria-label="Raouf Renal Academy — home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(({ href, labelKey, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2 xl:px-3 py-1.5 text-xs font-medium transition-colors",
                  pathname === href || (href !== "/" && pathname.startsWith(href))
                    ? "bg-accent text-canvas"
                    : "text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{t(labelKey, label)}</span>
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {mounted && streak > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-gold tabular-nums">
                🔥 {streak}d
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost p-2"
              aria-label="Toggle dark/light theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              className="btn btn-ghost flex items-center gap-1 p-2 sm:px-2.5 text-xs"
              aria-label="Toggle language"
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === "fa" ? "EN" : "فارسی"}</span>
            </button>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="btn btn-ghost flex items-center gap-1 p-2 sm:px-3 text-xs"
              aria-label="Open command palette"
            >
              <Command className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline text-muted">Search</span>
              <kbd className="hidden sm:inline rounded border border-white/10 bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </header>
      <motion.main
        initial={mounted ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8"
      >
        {children}
      </motion.main>
      <MobileNav />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
