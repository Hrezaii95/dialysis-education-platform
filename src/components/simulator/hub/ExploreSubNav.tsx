"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/providers/LanguageProvider";
import {
  EXPLORE_VIEWS,
  EXPLORE_VIEW_I18N,
  EXPLORE_VIEW_LABELS,
  type ExploreView,
} from "@/lib/simulation-hub";

export function ExploreSubNav({
  view,
  onViewChange,
}: {
  view: ExploreView;
  onViewChange: (v: ExploreView) => void;
}) {
  const { t } = useLang();

  return (
    <nav
      aria-label={t("hub.explore.nav", "Explore sections")}
      className="-mx-1 flex gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1 scrollbar-none"
    >
      {EXPLORE_VIEWS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onViewChange(id)}
          className={cn(
            "shrink-0 min-w-[max(7rem,28%)] flex-1 rounded-md px-2.5 py-2.5 text-center text-[11px] font-medium transition-colors sm:px-4 sm:text-xs",
            view === id ? "bg-accent text-canvas" : "text-muted hover:text-text"
          )}
        >
          {t(EXPLORE_VIEW_I18N[id], EXPLORE_VIEW_LABELS[id])}
        </button>
      ))}
    </nav>
  );
}

/** Legacy link helper for explore sub-views within the hub. */
export function exploreViewHref(view: ExploreView): string {
  if (view === "operate") return "/simulator?step=explore";
  return `/simulator?step=explore&view=${view}`;
}

export function ExploreViewLink({
  view,
  children,
  className,
}: {
  view: ExploreView;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={exploreViewHref(view)} className={className}>
      {children}
    </Link>
  );
}
