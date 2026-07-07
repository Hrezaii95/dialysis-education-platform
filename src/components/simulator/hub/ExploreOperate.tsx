"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Rotate3d,
  Layers,
  Droplets,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";
import { DIALYZERS, LEGEND, SYSTEMS } from "./device-data";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading 3D…
      </div>
    ),
  }
);

const DeviceScene3D = dynamic(
  () =>
    import("@/components/devices/DeviceScene3D").then((m) => m.DeviceScene3D),
  { ssr: false }
);

export function ExploreOperate({
  system,
  dialyzer,
  autoSub,
  systemId,
  dialyzerId,
  convIndex,
  features,
  updateUrl,
  setSkillInProgress,
}: {
  system: (typeof SYSTEMS)[number];
  dialyzer: (typeof DIALYZERS)[number];
  autoSub: boolean;
  systemId: string;
  dialyzerId: string;
  convIndex: number;
  features: string[];
  updateUrl: (p: Record<string, string>) => void;
  setSkillInProgress: () => void;
}) {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
      <div className="relative min-w-0 lg:col-span-3">
        <div className="glass-panel h-[min(280px,45dvh)] overflow-hidden rounded-2xl sm:h-[min(360px,50dvh)] lg:h-[min(540px,70vh)]">
          <Canvas camera={{ position: [3.2, 1.4, 3.8], fov: 42 }} shadows>
            <DeviceScene3D
              systemColor={system.color}
              dialyzerColor={dialyzer.color}
              autoSub={autoSub}
              systemLabel={system.label}
              convective={dialyzer.convective}
            />
          </Canvas>
        </div>
        <div className="mt-3 rounded-xl legend-overlay p-3 sm:absolute sm:left-4 sm:top-4 sm:mt-0 sm:max-w-[200px]">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted">
            <Rotate3d className="h-3 w-3" /> {t("deviceLab.dragRotate", "Drag to rotate")}
          </div>
          <ul className="space-y-1">
            {LEGEND.map((l) => (
              <li
                key={l.t}
                className="flex items-center gap-2 text-[11px] text-muted"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: l.c }}
                />
                {l.t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-2">
        <div className="glass-panel p-4 sm:p-5">
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-sm sm:text-base">
            <Layers className="h-4 w-4 text-flow" /> {t("deviceLab.system.title", "System")}
          </h3>
          <p className="mb-3 text-xs text-muted">
            {t("deviceLab.system.subtitle", "Switch generation — note which supports online-HDF.")}
          </p>
          <div className="flex flex-wrap gap-2">
            {SYSTEMS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn text-xs ${systemId === s.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => {
                  updateUrl({ system: s.id });
                  setSkillInProgress();
                }}
              >
                {s.name}
                {!s.hdf && (
                  <span className="ml-1 opacity-60">{t("deviceLab.system.hdOnly", "· HD only")}</span>
                )}
              </button>
            ))}
          </div>
          {!system.hdf && (
            <p className="mt-3 rounded-md bg-gold/10 px-2.5 py-2 text-[11px] leading-relaxed text-gold">
              {t(
                "deviceLab.legacyNote",
                "High-flux HD only. Online-HDF needs a 5008S/6008-class platform — a 4008S cannot deliver it. (All specs IFU-pending.)"
              )}
            </p>
          )}
        </div>

        <div className="glass-panel p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm sm:text-base">
            <Droplets className="h-4 w-4 text-gold" /> {t("deviceLab.dialyzer.title", "Dialyzer")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIALYZERS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`btn text-xs ${dialyzerId === d.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => updateUrl({ dialyzer: d.id })}
              >
                {d.name} · {d.area}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`btn mt-3 w-full text-xs ${autoSub ? "btn-primary" : "btn-ghost"}`}
            onClick={() => updateUrl({ autosub: autoSub ? "false" : "true" })}
            disabled={!system.hdf}
          >
            AutoSub plus substitution:{" "}
            {system.hdf ? (autoSub ? "ON" : "OFF") : "n/a (HD only)"}
          </button>
        </div>

        <div className="glass-panel p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base">{t("deviceLab.conv.title", "Convective clearance")}</h3>
            <span className="text-[11px] text-muted">{t("deviceLab.conv.educational", "educational")}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-flow to-raouf-blue transition-all duration-500 motion-reduce:transition-none"
              style={{ width: `${Math.round(convIndex * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {system.hdf
              ? t(
                  "deviceLab.conv.hdfNote",
                  "Online-HDF adds convection to remove middle molecules diffusion alone misses."
                )
              : t(
                  "deviceLab.conv.hdNote",
                  "HD only — diffusive clearance, no convective component."
                )}
          </p>
          <Link
            href="/convince"
            className="mt-3 inline-flex items-center gap-1 text-xs text-gold transition-all hover:gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" /> {t("deviceLab.conv.evidence", "Evidence: high-volume HDF & CONVINCE")}{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="glass-panel p-4 sm:p-5 text-sm">
          <h3 className="mb-2 font-semibold">{t("deviceLab.config.title", "This configuration")}</h3>
          <ul className="space-y-1 text-xs text-muted">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <span className="text-flow">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { SYSTEMS, DIALYZERS };
