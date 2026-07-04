/**
 * daily5.ts — Seeded spaced-retrieval card deck for the Daily-5 session.
 *
 * Every card traces to a cited source from MY-PATH-CURRICULUM.md.
 * Cards span all six competencies (c1–c6) and all three knowledge types.
 */

import { isDue } from "@/lib/srs";
import type { Card } from "@/lib/srs";
import type { KnowledgeType } from "@/lib/competencies";

// ── Card definition ────────────────────────────────────────────────────────────

export interface DeckCard {
  id: string;
  competencyId: string; // c1..c6
  knowledgeType: KnowledgeType;
  front: string; // question / prompt shown face-up
  back: string; // answer revealed on flip
  source: string; // cited reference
}

// ── The seeded deck (~11 cards, one per locked Daily-5 seed topic) ────────────

export const DAILY5_DECK: DeckCard[] = [
  // C1 — Understand the therapy (declarative)
  {
    id: "d5-c1-a",
    competencyId: "c1",
    knowledgeType: "declarative",
    front: "What is the minimum convection volume target that confers a mortality benefit in high-volume HDF, and which trial established it?",
    back: "≥23 L/session. The CONVINCE trial (Blankestijn 2023) enrolled 1,360 patients all targeted ≥23 L (mean achieved 25.3 L) and showed HR 0.77 (95% CI 0.65–0.93) for all-cause mortality vs standard HD.",
    source: "CONVINCE · Blankestijn PJ et al. N Engl J Med. 2023;389(8):700-9. DOI 10.1056/NEJMoa2304820",
  },
  {
    id: "d5-c1-b",
    competencyId: "c1",
    knowledgeType: "declarative",
    front: "Describe the difference between diffusion and convection as solute-clearance mechanisms in dialysis.",
    back: "Diffusion moves solutes down a concentration gradient across the membrane (efficient for small molecules like urea, creatinine). Convection uses solvent drag — fluid is pushed through the membrane pulling solutes with it — giving superior clearance of middle molecules (e.g. β2-microglobulin, MW ~11.8 kDa) that diffusion clears poorly.",
    source: "HDF CoE Module 1 · HV-HDF Handbook Ch.2 (conventional→HV-HDF) + Ch.4 (solute clearances)",
  },
  {
    id: "d5-c1-c",
    competencyId: "c1",
    knowledgeType: "conditional",
    front: "If you increase the convection volume during a post-dilution HDF session, what happens to middle-molecule clearance and why?",
    back: "Middle-molecule clearance rises proportionally. Convection clearance = sieving coefficient × convective volume; for a molecule like β2-M (sieving coefficient ≈1), every extra litre of convective flow adds one litre of clearance — unlike diffusion, which is rate-limited by membrane gradient.",
    source: "HDF CoE Module 1 · HV-HDF Handbook Ch.4 (EUTox small/middle/large, sieving coefficient)",
  },

  // C2 — Vascular access (procedural)
  {
    id: "d5-c2-a",
    competencyId: "c2",
    knowledgeType: "procedural",
    front: "What minimum blood flow rate (Qb) is required to sustain adequate convective volumes in online HDF, and why does access type matter?",
    back: "Qb ≥330 mL/min is the target for online HDF. AVF is preferred because it delivers stable high flow; catheters and poorly-developed grafts often cannot sustain ≥330 mL/min without recirculation, capping the achievable convection volume.",
    source: "HDF CoE Module 4 · HV-HDF Handbook Ch.9 (AVF preferred, Qb ≥330)",
  },

  // C3 — Operate the 5008 (procedural)
  {
    id: "d5-c3-a",
    competencyId: "c3",
    knowledgeType: "procedural",
    front: "What is the role of the DIASAFE+ ultrafilter in online HDF, and why must the substitution line be verified before initiating treatment?",
    back: "DIASAFE+ is a bacterial/endotoxin-retentive ultrafilter positioned on the online substitution line. It converts dialysate-quality water into sterile substitution fluid infused directly into the bloodstream. Before treatment, the integrity of this line must be verified (pressure test / visual check) because a breach means non-sterile fluid enters the patient's blood.",
    source: "5008 IFU (IFU-pending) · HDF CoE Module 3 (online generation of sterile fluid) · Glossary-machine-components.md",
  },

  // C4 — Deliver HDF prescription + water safety (declarative + conditional)
  {
    id: "d5-c4-a",
    competencyId: "c4",
    knowledgeType: "declarative",
    front: "What is the water-quality floor for online HDF dialysate, and why is it stricter than standard HD?",
    back: "Ultrapure dialysate: <0.1 CFU/mL bacteria and <0.03 EU/mL endotoxin. Stricter than standard HD because the online substitution fluid is infused directly into blood (no second membrane barrier). Endotoxin fragments that breach DIASAFE+ trigger systemic inflammatory responses.",
    source: "HDF CoE Module 3 (online generation of sterile fluid) · HV-HDF Handbook Ch.5 (fluid quality)",
  },
  {
    id: "d5-c4-b",
    competencyId: "c4",
    knowledgeType: "conditional",
    front: "What is filtration fraction (FF) in post-dilution HDF and what is its safe ceiling? What happens if you exceed it?",
    back: "FF = convective volume ÷ plasma-water flow rate (approximately Qb × 0.6). Safe ceiling is generally ≤25–30%. Exceeding it raises blood viscosity in the filter, increasing TMP, membrane fouling, and clotting risk — reducing both clearance and patient safety.",
    source: "HV-HDF Handbook Ch.3 (filtration fraction) · HDF CoE Module 6 (delivering high-volume HDF)",
  },

  // C5 — Monitor adequacy & complications (conditional)
  {
    id: "d5-c5-a",
    competencyId: "c5",
    knowledgeType: "conditional",
    front: "A patient on dialysate K 1.5 mmol/L is also on digoxin. Why is this a sudden-death risk, and what is your first move?",
    back: "Low-potassium dialysate in a digoxin patient is high risk: hypokalemia potentiates digoxin toxicity (increased myocardial sensitivity → fatal arrhythmia). First move: check/adjust dialysate-K to ≥2 mmol/L immediately, obtain 12-lead ECG, check serum K and digoxin level, notify physician. Dialysate K <2 mmol/L is contraindicated with digoxin.",
    source: "HDF CoE Appcourses 10–14 (intradialytic complications) · Karaboyas 2017 (dialysate K and arrhythmia risk) · MY-PATH C5 seed",
  },
  {
    id: "d5-c5-b",
    competencyId: "c5",
    knowledgeType: "conditional",
    front: "State the first-move sequence for intradialytic hypotension (IDH). What are the immediate nursing actions in order?",
    back: "1. Trendelenburg (lower head, raise legs). 2. Stop UF (set UF rate to zero). 3. Give 100–250 mL saline bolus rapidly. 4. Reduce blood flow rate temporarily if BP remains low. 5. Notify physician. 6. Consider cool dialysate and dialysate-Ca adjustment for recurrent IDH (midodrine if preventive). Document and reassess.",
    source: "HDF CoE Appcourse 10 (IDH) · HV-HDF Handbook Ch.9 (patient selection/monitoring) · MY-PATH C5 IDH first-moves",
  },
  {
    id: "d5-c5-c",
    competencyId: "c5",
    knowledgeType: "conditional",
    front: "A patient arrives with potassium 7.2 mmol/L (severe hyperkalemia). What is the correct order of interventions: calcium gluconate, insulin+dextrose, sodium bicarbonate, dialysis?",
    back: "Ca first → shift → remove. 1. Calcium gluconate IV (membrane stabilisation — fastest cardiac protection, within 5 min). 2. Insulin + dextrose ± sodium bicarbonate (shift K into cells). 3. Remove: dialysis (most effective removal) or kayexalate if dialysis delayed. Never skip calcium — it does not lower K but prevents fatal arrhythmia during the shift phase.",
    source: "MY-PATH C5 seed (Ca→shift→remove order) · Standard nephrology emergency protocol",
  },

  // C6 — Know the evidence (declarative)
  {
    id: "d5-c6-a",
    competencyId: "c6",
    knowledgeType: "declarative",
    front: "Summarise the CONVINCE (2023) and ESHOL (2013) trial results in one sentence each, including the key hazard ratio.",
    back: "CONVINCE (NEJM 2023): 1,360 patients targeted ≥23 L HDF vs HD; all-cause mortality HR 0.77 (95% CI 0.65–0.93) — approximately 23% relative risk reduction. ESHOL (JASN 2013): ~906 patients; all-cause mortality HR 0.70 (95% CI 0.53–0.92, P=0.01) in favour of HDF; benefit concentrated in highest convective-volume tertile (>23 L).",
    source: "CONVINCE · Blankestijn PJ et al. NEJM 2023;389(8):700-9. DOI 10.1056/NEJMoa2304820 · ESHOL · Maduell F et al. JASN 2013;24(3):487-97. DOI 10.1681/ASN.2012080875",
  },
  {
    id: "d5-c6-b",
    competencyId: "c6",
    knowledgeType: "conditional",
    front: "CONTRAST and Turkish OL-HDF were null trials overall. Why did they fail to show a mortality benefit, and what did their post-hoc analyses reveal?",
    back: "Both trials achieved only ~14–15 L/session average convective volume — below the therapeutic threshold. They did not fail HDF; they failed to reach high-volume HDF. Post-hoc analyses of both showed mortality signals at higher convective volumes (CONTRAST: >19.9 L; Turkish: >17.4 L), consistent with a dose-response relationship confirmed by the Lancet IPD meta-analysis (Peters 2022).",
    source: "CONTRAST · Grooteman MPC et al. JASN 2012;23(6):1087-96. DOI 10.1681/ASN.2011121140 · Turkish OL-HDF · Ok E et al. NDT 2013;28(1):192-202. DOI 10.1093/ndt/gfs407 · IPD meta-analysis · Peters SAE et al. Lancet 2022",
  },
];

// ── Session selector ───────────────────────────────────────────────────────────

/**
 * Select up to 5 cards for a Daily-5 session.
 *
 * Strategy:
 *  1. Due cards first (isDue === true at `now`), sorted by most overdue (smallest due timestamp).
 *  2. Unseen cards (lastReview === 0) next, in deck order.
 *  3. Fill remaining slots with soonest-upcoming cards.
 *
 * `storeCards` is the `cards` record from the store (keyed by competencyId, one card per competency).
 * Multiple deck cards may share the same competencyId — we use the same store card for SRS scheduling.
 */
export function todaysFive(
  storeCards: Record<string, import("@/lib/srs").Card>,
  now: number
): DeckCard[] {
  const due: DeckCard[] = [];
  const unseen: DeckCard[] = [];
  const upcoming: DeckCard[] = [];

  for (const dc of DAILY5_DECK) {
    const card: Card | undefined = storeCards[dc.competencyId];
    if (!card || card.lastReview === 0) {
      unseen.push(dc);
    } else if (isDue(card, now)) {
      due.push(dc);
    } else {
      upcoming.push(dc);
    }
  }

  // Sort due by most overdue first (smallest `due` timestamp)
  due.sort((a, b) => {
    const da = storeCards[a.competencyId]?.due ?? 0;
    const db = storeCards[b.competencyId]?.due ?? 0;
    return da - db;
  });

  // Sort upcoming by soonest-due first
  upcoming.sort((a, b) => {
    const da = storeCards[a.competencyId]?.due ?? Infinity;
    const db = storeCards[b.competencyId]?.due ?? Infinity;
    return da - db;
  });

  const pool = [...due, ...unseen, ...upcoming];
  return pool.slice(0, 5);
}
