"use client";

import { useCallback, useRef, useState } from "react";
import { ALARM_CATALOG } from "@/lib/alarms";
import { emitStatement } from "@/lib/xapi";
import { usePlatformStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bell, Check, Volume2 } from "lucide-react";

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

export default function AlarmsPage() {
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Alarm Response Trainer</h1>
        <p className="mt-1 text-sm text-muted">
          8 critical alarms with audio cues and first-response checklists — dialysis-nurse spec
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ALARM_CATALOG.map((alarm) => (
          <div
            key={alarm.id}
            className={cn(
              "glass-panel p-5 transition-all",
              active === alarm.id && "alarm-pulse border-danger/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded",
                    alarm.severity === "critical" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                  )}
                >
                  {alarm.severity}
                </span>
                <h3 className="mt-2 font-semibold">{alarm.name}</h3>
                <p className="text-xs text-muted mt-1">{alarm.code}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost p-2"
                onClick={() => trigger(alarm.id, alarm.frequency)}
                aria-label={`Trigger ${alarm.name}`}
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted">{alarm.mechanism}</p>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium uppercase text-muted">First response</div>
              {alarm.firstResponse.map((step, i) => (
                <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
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
                className="btn btn-primary w-full mt-4 text-sm"
                onClick={() => acknowledge(alarm.id)}
              >
                <Check className="h-4 w-4" /> Acknowledge alarm
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted flex items-center justify-center gap-2">
        <Bell className="h-3.5 w-3.5" /> Educational trainer — follow your unit protocol in clinical practice
      </p>
    </div>
  );
}
