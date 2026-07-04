// The AREP vendor-academy resources embedded in each competency's curriculum (per the locked
// MY-PATH-CURRICULUM.md). C1 is fully populated for the demo: real AREP infographics + a webinar
// video with transcript + the flipbook reading. Assets are in /public/assets/arep/<comp>/.

import { withBasePath } from "@/lib/asset";

export type ResourceType = "infographic" | "video" | "audio" | "reading" | "daily5";

export interface Resource {
  type: ResourceType;
  title: string;
  src?: string; // asset path (image/video) or app route (reading)
  track?: string; // .srt/.vtt transcript for video/audio
  source: string; // AREP attribution
  note?: string;
}

export const COMPETENCY_RESOURCES: Record<string, Resource[]> = {
  c1: [
    { type: "infographic", title: "Hemodialysis — diffusion", src: withBasePath("/assets/arep/c1/hemodialysis.gif"), source: "AREP · Advanced Renal Education Program" },
    { type: "infographic", title: "Hemodiafiltration — diffusion + convection", src: withBasePath("/assets/arep/c1/hemodiafiltration.gif"), source: "AREP" },
    { type: "infographic", title: "Convective clearance", src: withBasePath("/assets/arep/c1/convective-clearance.png"), source: "AREP" },
    { type: "infographic", title: "Clearance compared: HD vs HF vs HDF", src: withBasePath("/assets/arep/c1/comparison-clearance.gif"), source: "AREP" },
    { type: "infographic", title: "Sieving coefficient", src: withBasePath("/assets/arep/c1/sieving-coefficient.gif"), source: "AREP" },
    { type: "infographic", title: "HDF efficacy — post-dilution", src: withBasePath("/assets/arep/c1/hdf-efficacy-postdilution.gif"), source: "AREP" },
    { type: "video", title: "LIFE 2024 · Episode 1 — The CONVINCE Trial (webinar)", src: withBasePath("/assets/arep/c1/life2024-ep1-convince.mp4"), track: withBasePath("/assets/arep/c1/life2024-ep1.vtt"), source: "AREP webinar", note: "captioned transcript included" },
    { type: "reading", title: "Flipbook Ch.1–2 — Why convection", src: "/flipbook?page=m1-p1", source: "HV-HDF Handbook (Ch.2 + Ch.4)" },
    { type: "daily5", title: "Daily-5 — diffusion vs convection cards", src: "/daily-5", source: "spaced retrieval" },
  ],
};

export const RESOURCE_LABEL: Record<ResourceType, string> = {
  infographic: "Infographic",
  video: "Webinar / video",
  audio: "Audio",
  reading: "Reading",
  daily5: "Daily-5",
};

export function resourcesFor(id: string): Resource[] {
  return COMPETENCY_RESOURCES[id] ?? [];
}
