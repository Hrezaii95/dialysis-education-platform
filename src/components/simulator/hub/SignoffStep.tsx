"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, BadgeCheck } from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";

export function SignoffStep({ onComplete }: { onComplete: () => void }) {
  const { t } = useLang();
  const [confirmed, setConfirmed] = useState(false);
  const signoffItems = [
    "hub.signoff.item1",
    "hub.signoff.item2",
    "hub.signoff.item3",
    "hub.signoff.item4",
  ] as const;
  const signoffFallback: Record<(typeof signoffItems)[number], string> = {
    "hub.signoff.item1": "Explored the 5008S CorDiax 3D model, fluid circuit, monitor, and concept labs",
    "hub.signoff.item2": "Confirmed the DIASAFE®plus ultrafilter and online substitution-fluid line requirements",
    "hub.signoff.item3": "Completed patient case scenarios with citation-gated debrief",
    "hub.signoff.item4": "Responded to TMP and critical alarm scenarios",
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 sm:p-5">
        <div className="mb-1 flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-flow" />
          <h2 className="text-lg font-semibold">{t("hub.signoff.title", "Simulation Hub Sign-off")}</h2>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-muted">
          {t("hub.signoff.body", "You have completed the guided Simulation Hub sequence:")}
        </p>
        <ul className="mb-6 space-y-2 text-sm">
          {signoffItems.map((key) => (
            <li key={key} className="flex items-start gap-2 text-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{t(key, signoffFallback[key])}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" /> {t("common.eduModel", "Educational model — not clinical decision support.")}
        </div>

        {!confirmed ? (
          <div className="mt-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-surface-2/40 p-4 transition-colors hover:bg-surface-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-flow)]"
                onChange={(e) => {
                  if (e.target.checked) setConfirmed(true);
                }}
              />
              <span className="text-sm">
                {t(
                  "deviceLab.signoff.confirm",
                  "I confirm that I have reviewed this educational module as an HCP in a learning context. I understand this is not clinical guidance and all device values are IFU-pending."
                )}
              </span>
            </label>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
              {t("hub.signoff.mastered", "Simulation Hub mastered — C3 gate complete")}
            </div>
            <button type="button" className="btn btn-primary gap-1.5" onClick={onComplete}>
              {t("deviceLab.signoff.record", "Record completion")} <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
