/** Educational HDF fluid dynamics model — council-vetted, not clinical DSS */

export interface SimInputs {
  qb: number; // mL/min blood flow
  convectionL: number;
  modality: "hd" | "hdf";
  accessFlow: number;
  accessType: "avf" | "catheter";
  dialyzerConvective: number; // 60-88
  systolicBp: number;
  autoSubEnabled: boolean;
}

export interface SimOutputs {
  tmp: number;
  filtrationFraction: number;
  clearanceIndex: number;
  qolIndex: number;
  hypotensionRisk: number;
  clotRisk: number;
  alarm: AlarmType | null;
  mechanism: string;
}

export type AlarmType =
  | "TMP_HIGH"
  | "VENOUS_PRESSURE"
  | "ACCESS_FLOW_LOW"
  | "HYPOTENSION"
  | "AIR_DETECT";

export function computePhysics(input: SimInputs): SimOutputs {
  const qf = input.modality === "hd" ? 0 : input.convectionL;
  const ff = input.qb > 0 ? (qf / input.qb) * 100 : 0;

  let tmp = 120 + ff * 2.8 + (input.dialyzerConvective - 60) * 0.5;
  if (input.autoSubEnabled && input.modality === "hdf") tmp *= 0.88;

  let clotRisk = clamp(ff > 33 ? (ff - 33) * 4 : 0, 0, 95);
  if (input.qb < 300 && qf >= 20) clotRisk += 25;

  let clearance = 55;
  if (input.modality === "hdf") {
    clearance = 55 + qf * 1.1 + (input.dialyzerConvective - 60) * 0.3;
    if (input.qb >= 400) clearance += 6;
  } else {
    clearance = 52 + input.dialyzerConvective * 0.15;
  }

  if (input.accessType === "catheter" && qf >= 23) {
    clearance -= 15;
    clotRisk += 10;
  }
  if (input.accessFlow < 350 && qf >= 23) clearance -= 8;

  // IDH model: HDF with convective therapy + cool dialysate does NOT raise
  // hypotension risk vs high-flux HD — per CONVINCE secondary endpoint and
  // Maggiore thermal-balance RCT. Convection is neutral-to-protective at target
  // dosing (≥23 L). Only UF-rate stress (captured via low SBP baseline) drives risk.
  // Catheter access (higher recirculation, less haemodynamic reserve) adds a small penalty.
  let hypotensionRisk = input.modality === "hdf"
    ? Math.max(25, 35 - (qf >= 23 ? 5 : 0)) // HDF equal-or-lower vs HD baseline of 35
    : 35;                                      // HD baseline
  if (input.systolicBp < 115) hypotensionRisk += 22;
  if (input.systolicBp < 100) hypotensionRisk += 18;
  if (input.accessType === "catheter" && qf >= 23) hypotensionRisk += 5;

  const qol = 58 + (clearance - 55) * 0.45 - hypotensionRisk * 0.15;

  let alarm: AlarmType | null = null;
  if (tmp > 450) alarm = "TMP_HIGH";
  else if (ff > 35) alarm = "TMP_HIGH";
  else if (input.accessFlow < 280) alarm = "ACCESS_FLOW_LOW";
  else if (input.systolicBp < 95) alarm = "HYPOTENSION";

  const mechanism =
    alarm === "TMP_HIGH"
      ? `Filtration fraction ${ff.toFixed(1)}% drives TMP to ${tmp.toFixed(0)} mmHg — hemoconcentration at filter outlet increases clot risk.`
      : alarm === "ACCESS_FLOW_LOW"
        ? `Access flow ${input.accessFlow} mL/min may not sustain convection ≥23 L — CONVINCE dosing requires adequate Qb.`
        : qf >= 23
          ? `Post-dilution HDF at ${qf} L convection enhances middle-molecule clearance (educational index ${clearance.toFixed(0)}).`
          : `Diffusive HD dominates; middle-molecule removal remains limited.`;

  return {
    tmp: clamp(tmp, 80, 520),
    filtrationFraction: clamp(ff, 0, 45),
    clearanceIndex: clamp(clearance, 35, 98),
    qolIndex: clamp(qol, 40, 95),
    hypotensionRisk: clamp(hypotensionRisk, 10, 95),
    clotRisk: clamp(clotRisk, 0, 95),
    alarm,
    mechanism,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
