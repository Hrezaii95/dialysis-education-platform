"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { COMPETENCIES } from "@/lib/competencies";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { id: "dash", label: "Dashboard", href: "/" },
  { id: "my-path", label: "My Path", href: "/my-path" },
  { id: "assess", label: "Assess & Certify", href: "/assessment" },
  { id: "admin", label: "Admin", href: "/admin" },
];

const JOURNEYS = COMPETENCIES.map((c) => ({
  id: c.id,
  label: `${c.code} · ${c.title}`,
  href: `/learn/${c.id}`,
}));

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-3 sm:p-4 pt-[10vh] sm:pt-[15vh] backdrop-blur-sm">
      <Command
        className="w-full max-w-lg max-h-[85dvh] overflow-hidden rounded-xl border border-white/10 bg-surface-1 shadow-2xl flex flex-col"
        label="Command palette"
      >
        <Command.Input
          placeholder="Search modules, cases, IFU terms…"
          className="w-full border-b border-white/8 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
        />
        <Command.List className="max-h-[min(60dvh,320px)] overflow-y-auto p-2 overscroll-contain">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            No results.
          </Command.Empty>
          <Command.Group heading="Navigate" className="text-[10px] uppercase tracking-wider text-muted px-2 py-1">
            {PAGES.map((p) => (
              <Command.Item
                key={p.id}
                value={p.label}
                onSelect={() => go(p.href)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm aria-selected:bg-accent/20"
              >
                {p.label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Competency Journeys" className="text-[10px] uppercase tracking-wider text-muted px-2 py-1 mt-2">
            {JOURNEYS.map((j) => (
              <Command.Item
                key={j.id}
                value={j.label}
                onSelect={() => go(j.href)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm aria-selected:bg-accent/20"
              >
                {j.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
