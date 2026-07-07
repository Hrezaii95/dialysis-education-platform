"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";
import { PRIME_ITEMS } from "./device-data";

export function PrimeStep({ onNext }: { onNext: () => void }) {
  const { t } = useLang();
  const [selections, setSelections] = useState<Record<string, boolean | null>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string, value: boolean) => {
    if (submitted) return;
    setSelections((prev) => ({ ...prev, [id]: value }));
  };

  const allAnswered = PRIME_ITEMS.every((item) => selections[item.id] !== undefined);
  const allCorrect = PRIME_ITEMS.every((item) => selections[item.id] === item.correct);

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-semibold">{t("deviceLab.prime.title", "Pre-treatment Prime Check")}</h2>
        <p className="mb-4 text-xs text-muted">
          {t(
            "deviceLab.prime.subtitle",
            "Before starting an online-HDF session on the 5008S, confirm which of the following items must be verified. Select Yes or No for each."
          )}
        </p>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" />{" "}
          {t(
            "deviceLab.prime.eduNote",
            "Educational model — not clinical decision support. Device values IFU-pending."
          )}
        </div>

        <ul className="mt-4 space-y-3">
          {PRIME_ITEMS.map((item) => {
            const label = t(`deviceLab.prime.item.${item.id}.label`, item.id);
            const explanation = t(`deviceLab.prime.item.${item.id}.explain`, "");
            const answer = selections[item.id];
            const isAnswered = answer !== undefined;
            const isCorrect = answer === item.correct;

            return (
              <li
                key={item.id}
                className={[
                  "rounded-xl border p-4 transition-colors",
                  !submitted
                    ? "border-white/10 bg-surface-2/50"
                    : isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-red-400/40 bg-red-400/10",
                ].join(" ")}
              >
                <p className="text-sm font-medium leading-snug">{label}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={submitted}
                    className={[
                      "btn text-xs",
                      isAnswered && answer === true
                        ? submitted
                          ? item.correct
                            ? "btn-primary"
                            : "bg-red-500/20 text-red-400 border-red-400/40"
                          : "btn-primary"
                        : "btn-ghost",
                    ].join(" ")}
                    onClick={() => toggle(item.id, true)}
                  >
                    {t("deviceLab.prime.yes", "Yes — required")}
                  </button>
                  <button
                    type="button"
                    disabled={submitted}
                    className={[
                      "btn text-xs",
                      isAnswered && answer === false
                        ? submitted
                          ? !item.correct
                            ? "btn-primary"
                            : "bg-red-500/20 text-red-400 border-red-400/40"
                          : "btn-primary"
                        : "btn-ghost",
                    ].join(" ")}
                    onClick={() => toggle(item.id, false)}
                  >
                    {t("deviceLab.prime.no", "No — not required")}
                  </button>
                </div>
                {submitted && (
                  <div
                    className={[
                      "mt-3 flex gap-2 rounded-md px-3 py-2 text-[11px] leading-relaxed",
                      isCorrect
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300",
                    ].join(" ")}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    )}
                    <span>{explanation}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!submitted ? (
            <button
              type="button"
              className="btn btn-primary gap-1.5 disabled:opacity-40"
              disabled={!allAnswered}
              onClick={handleSubmit}
            >
              {t("deviceLab.prime.check", "Check answers")}
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {allCorrect ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> {t("deviceLab.prime.allCorrect", "All checks correct")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> {t("deviceLab.prime.review", "Review the explanations above")}
                </span>
              )}
              <button type="button" className="btn btn-primary gap-1.5" onClick={onNext}>
                {t("hub.prime.continue", "Continue to Patient Cases")} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
