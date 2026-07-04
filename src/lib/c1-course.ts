// C1 · Understand the therapy — the full curriculum (~5.5 h, every content type).
// Grounds prd/MY-PATH-CURRICULUM.md. Real AREP assets in /public/assets/arep/c1/:
// 6 infographics, the LIFE-2024 CONVINCE webinar (+vtt), and the HVHDF Handbook PDF.
// Council fixes applied: one primary format per lesson, gate-by-doing (mastery on a correct
// prediction), real Daily-5 retrieval, cited evidence (PMID/DOI), interactive sims at the end.

export type LessonType =
  | "reading"
  | "infographic"
  | "slides"
  | "video"
  | "audio"
  | "pdf"
  | "interactive"
  | "quiz"
  | "flashcards"
  | "gate"
  | "sim";

export type WidgetKey = "convection" | "dose" | "sieving" | "dilution" | "lab" | "apply";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  minutes: number;
  source?: string;
  paras?: string[];
  takeaway?: string;
  img?: { src: string; alt: string; source: string; caption?: string };
  slides?: { title: string; bullets: string[] }[];
  video?: { src: string; track?: string; source: string; note?: string };
  audio?: { src: string; source: string; note?: string };
  pdf?: { src: string; title: string; pages?: string; source: string };
  widget?: WidgetKey;
  quiz?: { q: string; options: string[]; correct: number; explain: string }[];
  cards?: { front: string; back: string }[];
  gate?: { lead: string; question: string; options: string[]; correct: number; explain: string };
}

export interface Module {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  objectives: string[];
  modules: Module[];
}

import { withBasePath } from "@/lib/asset";

const A = withBasePath("/assets/arep/c1");

export const C1_COURSE: Course = {
  id: "c1",
  code: "C1",
  title: "Understand the therapy",
  subtitle: "HD vs HDF — diffusion, convection, and why convection clears the molecules diffusion leaves behind.",
  objectives: [
    "Distinguish diffusion from convection and what each clears",
    "Explain why HDF adds convection on top of HD",
    "Read the sieving coefficient and the pre- vs post-dilution trade-off",
    "Connect convective volume (the dose) to middle-molecule clearance and outcomes",
  ],
  modules: [
    {
      id: "m1",
      title: "Why diffusion isn't enough",
      summary: "What dialysis must remove, and where plain HD runs out of road.",
      lessons: [
        {
          id: "m1l1",
          type: "reading",
          title: "The job of dialysis",
          minutes: 10,
          source: "HVHDF Handbook Ch.2 · AREP HDF CoE Module 1",
          paras: [
            "A failing kidney stops clearing a wide spectrum of solutes — from tiny ones like urea and potassium to larger 'middle molecules' such as β2-microglobulin. Dialysis has to stand in for that clearance between sessions.",
            "Conventional hemodialysis (HD) clears solutes almost entirely by diffusion: molecules move across the dialyzer membrane from where they are concentrated (the blood) to where they are not (the dialysate).",
            "Diffusion is fast and effective for small solutes — but its efficiency falls steeply as molecules get larger. That gap is the whole reason hemodiafiltration exists.",
          ],
          takeaway: "Dialysis must clear a size-spectrum of toxins. Diffusion handles the small end well — and the middle end poorly.",
        },
        {
          id: "m1l2",
          type: "infographic",
          title: "Hemodialysis clears by diffusion",
          minutes: 5,
          img: { src: `${A}/hemodialysis.gif`, alt: "Diffusion across the dialyzer membrane", source: "AREP", caption: "Small solutes diffuse down the concentration gradient into the dialysate." },
          takeaway: "HD = diffusion down a concentration gradient.",
        },
        {
          id: "m1l3",
          type: "interactive",
          title: "Explore: diffusion vs molecule size",
          minutes: 10,
          widget: "convection",
          source: "Educational model",
          takeaway: "Watch small-solute clearance stay high while middle-molecule clearance lags — that's the diffusion ceiling.",
        },
        {
          id: "m1l4",
          type: "slides",
          title: "The solute size spectrum",
          minutes: 8,
          source: "HVHDF Handbook Ch.4 (EUTox classes)",
          slides: [
            { title: "Small solutes (<500 Da)", bullets: ["Urea (60 Da), potassium, creatinine", "Cleared efficiently by diffusion", "The classic HD target — and an incomplete one"] },
            { title: "Middle molecules (0.5–60 kDa)", bullets: ["β2-microglobulin (11.8 kDa), complement factor D, free light chains", "Poorly cleared by diffusion", "Accumulate over years on plain HD"] },
            { title: "Protein-bound & large", bullets: ["p-cresyl sulfate, indoxyl sulfate (bound)", "Hard for any current modality", "Beyond C1 — flagged, not solved here"] },
            { title: "Why it matters", bullets: ["Middle-molecule load is linked to amyloidosis and cardiovascular risk", "Clearing them needs a second mechanism — convection", "That is the HD → HDF story"] },
          ],
          takeaway: "It's the middle band — β2-microglobulin and friends — that diffusion misses.",
        },
        {
          id: "m1l5",
          type: "quiz",
          title: "Check yourself",
          minutes: 5,
          quiz: [
            { q: "Which solute is cleared LEAST well by diffusion?", options: ["Urea (60 Da)", "Potassium", "β2-microglobulin (11.8 kDa)", "Creatinine"], correct: 2, explain: "Diffusion efficiency falls with molecular weight; β2-microglobulin is a middle molecule that diffusion barely removes." },
            { q: "Diffusion is driven by…", options: ["A pressure gradient", "A concentration gradient", "Solvent drag", "Gravity"], correct: 1, explain: "Diffusion moves solutes down their concentration gradient across the membrane." },
          ],
        },
        {
          id: "m1l6",
          type: "flashcards",
          title: "Lock it in",
          minutes: 7,
          cards: [
            { front: "What drives diffusion?", back: "A concentration gradient across the membrane." },
            { front: "Diffusion efficiency vs molecular weight?", back: "Falls steeply as molecules get larger." },
            { front: "The marker middle molecule?", back: "β2-microglobulin (~11.8 kDa)." },
          ],
        },
      ],
    },
    {
      id: "m2",
      title: "Convection — the second engine",
      summary: "Solvent drag, ultrafiltration, and the substitution fluid that makes it safe.",
      lessons: [
        {
          id: "m2l1",
          type: "reading",
          title: "Convection & solvent drag",
          minutes: 10,
          source: "HVHDF Handbook Ch.3 · AREP HDF CoE Module 1",
          paras: [
            "Hemodiafiltration keeps everything HD does and adds convection. A large volume of plasma water is ultrafiltered across the membrane, and as it crosses it drags solutes along with it — solvent drag.",
            "Because convection doesn't depend on a concentration gradient, it removes larger molecules that diffusion can't touch. The bigger the convective (ultrafiltration) volume, the more middle-molecule mass leaves the blood.",
            "That ultrafiltered volume would dangerously dehydrate the patient, so it is replaced litre-for-litre with sterile substitution fluid generated online. The patient stays in balance while far more is cleared.",
          ],
          takeaway: "HDF = diffusion + convection. Convection drags middle molecules out; substitution fluid keeps the patient in balance.",
        },
        {
          id: "m2l2",
          type: "infographic",
          title: "Hemodiafiltration = diffusion + convection",
          minutes: 5,
          img: { src: `${A}/hemodiafiltration.gif`, alt: "Diffusion plus convection in HDF", source: "AREP", caption: "HDF layers convection on top of diffusion." },
          takeaway: "The added convection is the whole point of HDF.",
        },
        {
          id: "m2l3",
          type: "infographic",
          title: "Convective clearance",
          minutes: 5,
          img: { src: `${A}/convective-clearance.png`, alt: "Convective clearance by solvent drag", source: "AREP", caption: "Solute is carried across the membrane with the fluid." },
          takeaway: "Convective clearance scales with the convective volume.",
        },
        {
          id: "m2l4",
          type: "interactive",
          title: "Simulate: convection clearance",
          minutes: 12,
          widget: "convection",
          source: "Educational model",
          takeaway: "Raise the convective volume and watch middle-molecule clearance climb while small-solute clearance barely moves.",
        },
        {
          id: "m2l5",
          type: "audio",
          title: "Listen: the convection story",
          minutes: 8,
          audio: { src: `${A}/life2024-ep1-convince.mp4`, source: "AREP webinar · LIFE 2024 (audio)", note: "Audio of the CONVINCE webinar — listen on the go." },
          takeaway: "Same evidence, hands-free — the clinical case for convection.",
        },
        {
          id: "m2l6",
          type: "quiz",
          title: "Check yourself",
          minutes: 5,
          quiz: [
            { q: "Convection removes solute by…", options: ["Diffusion down a gradient", "Solvent drag with ultrafiltered fluid", "Adsorption to the membrane", "Osmosis"], correct: 1, explain: "Convection = solvent drag: solutes are carried across the membrane with the ultrafiltered plasma water." },
            { q: "Why is substitution fluid needed in HDF?", options: ["To raise blood pressure", "To replace the large ultrafiltered volume and keep the patient in balance", "To anticoagulate the circuit", "To warm the blood"], correct: 1, explain: "The high convective volume must be replaced litre-for-litre with sterile online-generated substitution fluid." },
          ],
        },
      ],
    },
    {
      id: "m3",
      title: "Membranes, sieving & middle molecules",
      summary: "High-flux membranes, the sieving coefficient, and why β2-microglobulin is the marker.",
      lessons: [
        {
          id: "m3l1",
          type: "reading",
          title: "The dialyzer membrane & flux",
          minutes: 10,
          source: "HVHDF Handbook Ch.3–4",
          paras: [
            "HDF needs a high-flux membrane: larger, more uniform pores and a high ultrafiltration coefficient (KUf). Low-flux membranes can't pass enough water or middle-molecule solute to make convection worthwhile.",
            "The pore size sets a cut-off: solutes well below it pass freely with the fluid; solutes near or above it are increasingly held back; albumin (66 kDa) should mostly stay in.",
            "How freely a given solute crosses with the fluid is captured by one number — the sieving coefficient.",
          ],
          takeaway: "High-flux membranes are the price of admission for convection.",
        },
        {
          id: "m3l2",
          type: "infographic",
          title: "The sieving coefficient",
          minutes: 5,
          img: { src: `${A}/sieving-coefficient.gif`, alt: "Sieving coefficient across the membrane", source: "AREP", caption: "Sieving coefficient ≈ ultrafiltrate concentration ÷ plasma concentration." },
          takeaway: "Sieving coefficient runs 0 (held back) to 1 (rides the fluid freely).",
        },
        {
          id: "m3l3",
          type: "interactive",
          title: "Explore: sieving vs molecular weight",
          minutes: 8,
          widget: "sieving",
          source: "Educational model",
          takeaway: "Drag the molecular weight from urea to β2-microglobulin to albumin and watch the sieving coefficient fall.",
        },
        {
          id: "m3l4",
          type: "pdf",
          title: "Read: HVHDF Handbook — solute classes",
          minutes: 14,
          pdf: { src: `${A}/HVHDF-Handbook.pdf`, title: "High-Volume HDF Handbook", pages: "Ch.4 — solute clearances", source: "Fresenius AREP · authorization-ready" },
          takeaway: "The primary source, in full — the EUTox solute classification and clearance data.",
        },
        {
          id: "m3l5",
          type: "slides",
          title: "β2-microglobulin & dialysis amyloidosis",
          minutes: 10,
          source: "HVHDF Handbook Ch.4",
          slides: [
            { title: "The marker middle molecule", bullets: ["β2-microglobulin, ~11.8 kDa", "Rises on diffusion-only HD over years", "Convection clears it; diffusion barely does"] },
            { title: "Why it matters clinically", bullets: ["Deposits as amyloid → dialysis-related amyloidosis", "Carpal tunnel, arthropathy, bone cysts", "A long-term consequence of incomplete clearance"] },
            { title: "The HDF answer", bullets: ["Convective volume removes β2-M mass each session", "Lower pre-dialysis β2-M on HV-HDF", "Foundation for the dose argument in Module 4"] },
          ],
          takeaway: "β2-microglobulin is the clinical face of the middle-molecule problem — and the textbook win for convection.",
        },
        {
          id: "m3l6",
          type: "quiz",
          title: "Check yourself",
          minutes: 5,
          quiz: [
            { q: "A sieving coefficient near 1 means the solute…", options: ["Is held back by the membrane", "Crosses with the fluid almost as freely as water", "Is removed by diffusion only", "Binds the membrane"], correct: 1, explain: "Sieving coefficient ≈ 1 → the solute passes with the ultrafiltrate nearly as freely as water." },
            { q: "Which membrane does HDF require?", options: ["Low-flux", "High-flux", "Either", "Cellulose only"], correct: 1, explain: "HDF needs a high-flux membrane with a high KUf and larger pores to pass convective volume and middle molecules." },
          ],
        },
      ],
    },
    {
      id: "m4",
      title: "Dose — more convection, more clearance",
      summary: "Convective volume is the HDF dose, and it has a dose–response.",
      lessons: [
        {
          id: "m4l1",
          type: "reading",
          title: "Convective volume is the dose",
          minutes: 10,
          source: "HVHDF Handbook Ch.6",
          paras: [
            "In HD the dose is Kt/V (a small-solute number). In HDF there is a second dose that matters more for middle molecules: the convective volume delivered per session.",
            "Line up the modalities — HD, high-flux HF, HDF — and small-solute clearance is similar across them, but middle-molecule clearance climbs with convective volume.",
            "That dose–response is why the field talks about 'high-volume' HDF and a target convective volume, not just 'HDF on or off.'",
          ],
          takeaway: "The lever is convective volume. More volume → more middle-molecule clearance.",
        },
        {
          id: "m4l2",
          type: "infographic",
          title: "Clearance compared: HD vs HF vs HDF",
          minutes: 5,
          img: { src: `${A}/comparison-clearance.gif`, alt: "Clearance compared across HD, HF and HDF", source: "AREP", caption: "Middle-molecule clearance rises from HD to HF to HDF." },
          takeaway: "Across the modalities, the middle-molecule line climbs with convection.",
        },
        {
          id: "m4l3",
          type: "interactive",
          title: "Simulate: the dose–response",
          minutes: 12,
          widget: "dose",
          source: "Educational model",
          takeaway: "Push the convective volume past ~23 L and watch where the benefit concentrates.",
        },
        {
          id: "m4l4",
          type: "slides",
          title: "The ≥23 L target (bridge to C4)",
          minutes: 8,
          source: "CONVINCE (NEJM 2023) · CONVINCE/ESHOL dosing",
          slides: [
            { title: "Where the number comes from", bullets: ["ESHOL: benefit concentrated in the highest convective-volume tertile", "CONVINCE: prescribed ≥23 L post-dilution", "Below that, the signal fades"] },
            { title: "What sets the achievable volume", bullets: ["Blood flow (Qb), session time, filtration fraction", "Post-dilution caps out at the FF ceiling", "This is the C4 prescription competency"] },
            { title: "Why C1 cares", bullets: ["Understanding the dose is the foundation for prescribing it", "Convection → middle molecules → outcomes", "C4 turns this into Qb/Qd/time settings"] },
          ],
          takeaway: "≥23 L post-dilution is the convective dose target — C1 explains why; C4 delivers it.",
        },
        {
          id: "m4l5",
          type: "quiz",
          title: "Check yourself",
          minutes: 5,
          quiz: [
            { q: "The HDF 'dose' for middle molecules is best captured by…", options: ["Kt/V", "Convective volume per session", "Dialysate flow", "Session number"], correct: 1, explain: "Convective (substitution) volume per session is the HDF dose that drives middle-molecule clearance." },
            { q: "Raising convective volume from 15 L to 25 L mainly increases clearance of…", options: ["Urea", "Sodium", "Middle molecules (e.g. β2-M)", "Water only"], correct: 2, explain: "Small-solute clearance is diffusion-dominated and changes little; middle-molecule clearance rises with convective volume." },
          ],
        },
        {
          id: "m4l6",
          type: "flashcards",
          title: "Lock it in",
          minutes: 5,
          cards: [
            { front: "The HDF dose for middle molecules?", back: "Convective (substitution) volume per session." },
            { front: "Post-dilution convective target (CONVINCE)?", back: "≥23 L per session." },
            { front: "More convective volume → ?", back: "More middle-molecule clearance (small-solute clearance barely changes)." },
          ],
        },
      ],
    },
    {
      id: "m5",
      title: "Pre- vs post-dilution & water",
      summary: "Where the substitution fluid goes, the filtration-fraction ceiling, and why HDF demands ultrapure water.",
      lessons: [
        {
          id: "m5l1",
          type: "reading",
          title: "Where the substitution fluid goes",
          minutes: 10,
          source: "HVHDF Handbook Ch.3",
          paras: [
            "Post-dilution adds the substitution fluid after the dialyzer. It is the most efficient option per litre, but it concentrates the blood inside the filter — so the safe filtration fraction (convective volume ÷ plasma-water flow) caps how much volume you can run before clotting and hemoconcentration.",
            "Pre-dilution adds fluid before the dialyzer, thinning the blood first. It is less efficient per litre, but it lets you reach high convective volumes even when blood flow is limited.",
            "The choice is a trade-off between efficiency and the filtration-fraction ceiling — and it depends on the access and blood flow you can achieve.",
          ],
          takeaway: "Post = efficient but FF-capped. Pre = higher volume at low blood flow.",
        },
        {
          id: "m5l2",
          type: "infographic",
          title: "Post-dilution efficacy",
          minutes: 5,
          img: { src: `${A}/hdf-efficacy-postdilution.gif`, alt: "Post-dilution HDF efficacy", source: "AREP", caption: "Post-dilution is the most efficient mode per litre of substitution." },
          takeaway: "Post-dilution wins on efficiency — until the FF ceiling bites.",
        },
        {
          id: "m5l3",
          type: "interactive",
          title: "Simulate: pre- vs post-dilution",
          minutes: 12,
          widget: "dilution",
          source: "Educational model",
          takeaway: "Set the blood flow and dilution mode; see the filtration fraction and the convective volume you can safely reach.",
        },
        {
          id: "m5l4",
          type: "reading",
          title: "Ultrapure water — non-negotiable",
          minutes: 8,
          source: "HVHDF Handbook Ch.5 · AREP HDF CoE Module 3",
          paras: [
            "In HDF the substitution fluid is infused directly into the patient's blood. So it must be sterile and non-pyrogenic — ultrapure: < 0.1 CFU/mL bacteria and < 0.03 EU/mL endotoxin.",
            "That purity comes from a chain — water treatment, ultrapure dialysate, and a point-of-use ultrafilter (e.g. DIASAFE+) as the last line of defence right before the fluid reaches the blood.",
            "This is why HDF is a platform decision, not just a setting: you cannot safely run online-HDF without the water chain behind it.",
          ],
          takeaway: "Substitution fluid goes into the blood — so HDF mandates ultrapure water (<0.1 CFU/mL) and an endpoint ultrafilter.",
        },
        {
          id: "m5l5",
          type: "quiz",
          title: "Check yourself",
          minutes: 5,
          quiz: [
            { q: "The filtration-fraction ceiling chiefly limits…", options: ["Pre-dilution", "Post-dilution", "Diffusion", "Dialysate flow"], correct: 1, explain: "Post-dilution concentrates blood in the filter, so the safe filtration fraction caps the convective volume." },
            { q: "Why does HDF require ultrapure water?", options: ["To improve taste", "Because substitution fluid is infused into the blood", "To reduce cost", "It doesn't"], correct: 1, explain: "The substitution fluid enters the bloodstream directly, so it must be sterile and non-pyrogenic (ultrapure)." },
          ],
        },
      ],
    },
    {
      id: "m6",
      title: "The evidence, in brief",
      summary: "Why high-volume HDF — the honest trial arc, null and positive.",
      lessons: [
        {
          id: "m6l1",
          type: "video",
          title: "Watch: LIFE 2024 — the CONVINCE trial",
          minutes: 16,
          video: { src: `${A}/life2024-ep1-convince.mp4`, track: `${A}/life2024-ep1.vtt`, source: "AREP webinar · LIFE 2024 Ep.1", note: "captioned" },
          takeaway: "The headline trial that put high-volume HDF on the map.",
        },
        {
          id: "m6l2",
          type: "reading",
          title: "What the trials showed",
          minutes: 8,
          source: "Cited — see below",
          paras: [
            "CONTRAST (Grooteman 2012, DOI 10.1681/ASN.2011100987) and the Turkish OL-HDF trial were null overall — but their delivered convective volumes were modest, and post-hoc the benefit appeared only at higher volumes.",
            "ESHOL (Maduell 2013, JASN; DOI 10.1681/ASN.2012080875) found lower all-cause mortality (HR 0.78) and cardiovascular mortality (HR 0.69) in the highest convective-volume tertile.",
            "CONVINCE (Blankestijn 2023, NEJM; DOI 10.1056/NEJMoa2304820) prescribed ≥23 L post-dilution and reported ~23% lower all-cause mortality vs high-flux HD. The IPD meta-analysis ties it together as a convective-dose–response.",
            "The honest read: the null trials didn't disprove HDF — they under-dosed it. The benefit is dose-dependent, which is exactly what makes it credible.",
          ],
          takeaway: "Dose, not label: benefit concentrates at high convective volume (≥23 L).",
        },
        {
          id: "m6l3",
          type: "slides",
          title: "The trial arc",
          minutes: 8,
          source: "Cited above",
          slides: [
            { title: "Null overall", bullets: ["CONTRAST 2012 — null ITT", "Turkish OL-HDF — null", "But: modest convective volumes"] },
            { title: "Signal at high dose", bullets: ["ESHOL highest tertile: HR 0.78 all-cause, 0.69 CV", "Post-hoc CONTRAST: benefit > ~19.9 L", "Dose-response emerging"] },
            { title: "Confirmation", bullets: ["CONVINCE 2023: ≥23 L, ~23% lower mortality", "IPD meta-analysis: convective-dose → outcome", "High-volume HDF, done right"] },
          ],
          takeaway: "Null → dose-response → confirmation. The arc is honest and it points one way.",
        },
        {
          id: "m6l4",
          type: "quiz",
          title: "Check yourself",
          minutes: 4,
          quiz: [
            { q: "Why were CONTRAST and the Turkish trial null overall?", options: ["HDF is ineffective", "They delivered modest convective volumes (under-dosed)", "Wrong patients", "Measurement error"], correct: 1, explain: "Both were null at modest convective volumes; benefit appears at higher volumes — a dose effect, not a failure of HDF." },
            { q: "CONVINCE prescribed a convective target of…", options: ["≥10 L", "≥15 L", "≥23 L", "≥40 L"], correct: 2, explain: "CONVINCE targeted ≥23 L post-dilution and reported ~23% lower all-cause mortality vs high-flux HD." },
          ],
        },
      ],
    },
    {
      id: "m7",
      title: "Demonstrate & simulate",
      summary: "Prove the gate, then take it into the sims and the rest of the journey.",
      lessons: [
        {
          id: "m7l1",
          type: "gate",
          title: "Demonstrate — predict the clearance change",
          minutes: 5,
          gate: {
            lead: "You advance by predicting, not by scrolling. Get this right to master C1.",
            question:
              "A post-dilution HDF session raises its convective (substitution) volume from 15 L to 25 L. What happens to β2-microglobulin (a middle molecule) clearance?",
            options: ["It increases substantially", "It stays about the same", "It decreases", "Only urea (small-solute) clearance changes"],
            correct: 0,
            explain:
              "Middle molecules are cleared by convection with a sieving coefficient near 1, so raising the convective volume raises their clearance substantially. Small-solute (urea) clearance is diffusion-dominated and barely moves — the dose–response that justifies high-volume HDF.",
          },
        },
        {
          id: "m7l2",
          type: "sim",
          title: "Sim: Convection Clearance Lab",
          minutes: 15,
          widget: "lab",
          source: "Educational model",
          takeaway: "Combine convective volume, membrane flux and dilution mode — and read the β2-microglobulin removal.",
        },
        {
          id: "m7l3",
          type: "sim",
          title: "Sim: Pre/Post-Dilution Lab",
          minutes: 10,
          widget: "dilution",
          source: "Educational model",
          takeaway: "Find the dilution mode and blood flow that safely reach ≥23 L.",
        },
        {
          id: "m7l4",
          type: "sim",
          title: "Apply it — across the journey",
          minutes: 10,
          widget: "apply",
          takeaway: "Take C1 into the Device Lab (operate) and the Clinical Simulator (decide).",
        },
        {
          id: "m7l5",
          type: "flashcards",
          title: "Final Daily-5",
          minutes: 6,
          cards: [
            { front: "What clears middle molecules?", back: "Convection (solvent drag) — not diffusion." },
            { front: "Sieving coefficient near 1 means…", back: "The solute crosses with the fluid almost as freely as water." },
            { front: "β2-microglobulin is cleared mainly by…", back: "Convection. Diffusion barely removes it." },
            { front: "Raise convective volume →", back: "Middle-molecule clearance rises; small-solute clearance barely changes." },
            { front: "Why ultrapure water for HDF?", back: "Substitution fluid is infused into the blood, so it must be sterile and non-pyrogenic." },
          ],
        },
      ],
    },
  ],
};

export function getCourse(id: string): Course | null {
  return id === "c1" ? C1_COURSE : null;
}

export interface FlatLesson extends Lesson {
  moduleId: string;
  moduleTitle: string;
  index: number;
}

export function flatten(course: Course): FlatLesson[] {
  const out: FlatLesson[] = [];
  course.modules.forEach((m) => {
    m.lessons.forEach((l) => out.push({ ...l, moduleId: m.id, moduleTitle: m.title, index: out.length }));
  });
  return out;
}

export function courseMinutes(course: Course): number {
  return course.modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.minutes, 0), 0);
}
