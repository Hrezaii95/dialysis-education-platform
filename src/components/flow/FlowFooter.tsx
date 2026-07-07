"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/providers/LanguageProvider";

export function FlowFooter({
  onBack,
  onContinue,
  backLabel,
  continueLabel,
  showBack = true,
  showContinue = true,
  continueDisabled = false,
  className,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  showBack?: boolean;
  showContinue?: boolean;
  continueDisabled?: boolean;
  className?: string;
}) {
  const { t } = useLang();
  if (!showBack && !showContinue) return null;

  return (
    <div className={cn("mt-6 flex flex-wrap items-center justify-between gap-3", className)}>
      {showBack && onBack ? (
        <button type="button" className="btn btn-ghost gap-1.5" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          {backLabel ?? t("flow.footer.back", "Back")}
        </button>
      ) : (
        <span />
      )}
      {showContinue && onContinue && (
        <button
          type="button"
          className="btn btn-primary gap-1.5 disabled:opacity-40"
          disabled={continueDisabled}
          onClick={onContinue}
        >
          {continueLabel ?? t("flow.footer.continue", "Continue")}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
