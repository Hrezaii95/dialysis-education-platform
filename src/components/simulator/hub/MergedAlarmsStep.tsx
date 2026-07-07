"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bell,
  Check,
  Volume2,
} from "lucide-react";
import { ALARM_CATALOG } from "@/lib/alarms";
import { emitStatement } from "@/lib/xapi";
import { usePlatformStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/providers/LanguageProvider";
import { TMP_ALARM_OPTIONS } from "./device-data";

function playAlarmTone(frequency: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "square";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    /* audio unavailable */
  }
}

function TmpScenario({ onComplete }: { onComplete: () => void }) {
  const { t } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = selected ? TMP_ALARM_OPTIONS.find((o) => o.id === selected) : null;

  return (
    <div className="glass-panel p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold">{t("deviceLab.alarms.title", "TMP Alarm Scenario")}</h2>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted">
        {t(
          "deviceLab.alarms.body",
          "During an online-HDF session on the 5008S, a Transmembrane Pressure (TMP) High alarm sounds. The alarm is audible and the TMP reading has climbed above the set limit within the last 2 minutes. The patient is stable. What is your first response?"
        )}
      </p>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
        <ShieldAlert className="h-3.5 w-3.5" />{" "}
        {t(
          "deviceLab.alarms.eduNote",
          "Educational scenario — clinical protocols may vary by site. IFU-pending."
        )}
      </div>

      <ul className="space-y-2">
        {TMP_ALARM_OPTIONS.map((opt, idx) => {
          const label = t(`deviceLab.alarms.opt.${opt.id}.label`, opt.id);
          const isSelected = selected === opt.id;
          const revealed = selected !== null;

          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={selected !== null}
                className={[
                  "btn w-full justify-start text-left text-xs leading-snug",
                  isSelected
                    ? opt.correct
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-red-400/50 bg-red-400/15 text-red-300"
                    : revealed && opt.correct
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400/70"
                      : "btn-ghost",
                ].join(" ")}
                onClick={() => setSelected(opt.id)}
              >
                <span className="mr-2 shrink-0 font-mono opacity-50">{idx + 1}.</span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <div
          className={[
            "mt-5 rounded-xl border p-4 text-sm leading-relaxed",
            chosen.correct
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-400/40 bg-red-400/10 text-red-300",
          ].join(" ")}
        >
          <div className="mb-1 flex items-center gap-2 font-semibold">
            {chosen.correct ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t("deviceLab.alarms.correct", "Correct")}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-400" /> {t("deviceLab.alarms.incorrect", "Incorrect")}
              </>
            )}
          </div>
          <p className="text-[12px]">{t(`deviceLab.alarms.opt.${chosen.id}.conseq`, "")}</p>
        </div>
      )}

      {selected && (
        <div className="mt-6 flex justify-end">
          <button type="button" className="btn btn-ghost gap-1.5 text-xs" onClick={onComplete}>
            {t("hub.alarms.trainerReveal", "Continue to alarm trainer")} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AlarmTrainerGrid() {
  const { t } = useLang();
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const startTime = useRef<number>(0);
  const setSkill = usePlatformStore((s) => s.setSkill);

  const trigger = useCallback((alarmId: string, frequency: number) => {
    setActive(alarmId);
    startTime.current = Date.now();
    playAlarmTone(frequency);
    emitStatement("experienced", `alarm-${alarmId}`, `Alarm triggered: ${alarmId}`);
  }, []);

  const toggleCheck = (alarmId: string, idx: number) => {
    setChecked((prev) => {
      const list = [...(prev[alarmId] ?? Array(4).fill(false))];
      list[idx] = !list[idx];
      return { ...prev, [alarmId]: list };
    });
  };

  const acknowledge = (alarmId: string) => {
    const latency = Date.now() - startTime.current;
    emitStatement("interacted", `alarm-${alarmId}`, "Alarm acknowledged", {
      durationMs: latency,
      extensions: { alarmId, latencyMs: latency },
    });
    setActive(null);
    const allDone = ALARM_CATALOG.every((a) => {
      const c = checked[a.id] ?? [];
      return c.filter(Boolean).length >= 2;
    });
    if (allDone) setSkill("alarms", "mastered", 90);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Bell className="h-4 w-4 text-gold" />
        {t(
          "hub.alarms.trainerIntro",
          "Alarm response trainer — 8 critical alarms with audio cues and first-response checklists."
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ALARM_CATALOG.map((alarm) => (
          <div
            key={alarm.id}
            className={cn(
              "glass-panel p-4 sm:p-5 transition-all",
              active === alarm.id && "alarm-pulse border-danger/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    alarm.severity === "critical" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                  )}
                >
                  {alarm.severity}
                </span>
                <h3 className="mt-2 font-semibold text-sm">{alarm.name}</h3>
                <p className="mt-1 text-xs text-muted">{alarm.code}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost shrink-0 p-2"
                onClick={() => trigger(alarm.id, alarm.frequency)}
                aria-label={`Trigger ${alarm.name}`}
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted">{alarm.mechanism}</p>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium uppercase text-muted">
                {t("hub.alarms.firstResponse", "First response")}
              </div>
              {alarm.firstResponse.map((step, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked[alarm.id]?.[i] ?? false}
                    onChange={() => toggleCheck(alarm.id, i)}
                    className="mt-1 accent-accent"
                  />
                  <span>{step}</span>
                </label>
              ))}
            </div>

            {active === alarm.id && (
              <button
                type="button"
                className="btn btn-primary mt-4 w-full text-sm"
                onClick={() => acknowledge(alarm.id)}
              >
                <Check className="h-4 w-4" /> {t("hub.alarms.acknowledge", "Acknowledge alarm")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MergedAlarmsStep({ onNext }: { onNext: () => void }) {
  const { t } = useLang();
  const [showTrainer, setShowTrainer] = useState(false);

  return (
    <div className="space-y-6">
      <TmpScenario onComplete={() => setShowTrainer(true)} />
      {showTrainer && <AlarmTrainerGrid />}
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary gap-1.5" onClick={onNext}>
          {t("deviceLab.alarms.continue", "Continue to Sign-off")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-xs text-muted">
        {t("hub.alarms.footer", "Educational trainer — follow your unit protocol in clinical practice")}
      </p>
    </div>
  );
}
