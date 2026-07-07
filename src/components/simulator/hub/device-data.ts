// Shared constants for the 3D operate explore view (Device Lab heritage).

export const SYSTEMS = [
  { id: "4008s", name: "4008S", label: "4008S", color: "#8A95A1", hdf: false },
  {
    id: "5008s",
    name: "5008S CorDiax",
    label: "5008S",
    color: "#5D8AD4",
    hdf: true,
  },
] as const;

export const DIALYZERS = [
  {
    id: "fx_highflux",
    name: "High-flux",
    convective: 60,
    color: "#8A95A1",
    area: "1.8 m²",
  },
  {
    id: "fx_coral",
    name: "FX CorAL",
    convective: 88,
    color: "#E39A3B",
    area: "2.0 m²",
  },
] as const;

export const LEGEND = [
  { c: "#fb7185", t: "Arterial / venous lines" },
  { c: "#9BC0F2", t: "DIASAFE®plus ultrafilter" },
  { c: "#E39A3B", t: "Hollow-fiber dialyzer" },
  { c: "#2E8E54", t: "AutoSub substitution port" },
] as const;

export interface PrimeItem {
  id: "diasafe" | "onlineLine" | "rinseback";
  correct: boolean;
}

export const PRIME_ITEMS: PrimeItem[] = [
  { id: "diasafe", correct: true },
  { id: "onlineLine", correct: true },
  { id: "rinseback", correct: false },
];

export interface AlarmOption {
  id: "checkKink" | "increaseQb" | "ignore" | "stop";
  correct: boolean;
}

export const TMP_ALARM_OPTIONS: AlarmOption[] = [
  { id: "checkKink", correct: true },
  { id: "increaseQb", correct: false },
  { id: "ignore", correct: false },
  { id: "stop", correct: false },
];
