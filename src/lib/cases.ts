// The 4 cited intradialytic-complication cases (locked PRD Section 4 / competency C5).
// Grounded in knowledge-base/synthesis/patient-cases.md + citations.md. Every clinical move is
// sourced; all device-panel numbers are IFU-pending (educational model, NOT clinical DSS).
// Case 1 (IDH) = full hero (DP1–DP3); Cases 2–4 = stubs (presentation + vitals + DP1) so the
// branching mechanic is visible. Council D2: show a self-referenced score AFTER the debrief.

export type Verdict = "correct" | "warning" | "wrong";

export interface CaseOption {
  id: string;
  label: string;
  verdict: Verdict;
  consequence: string;
  citation?: string;
}

export interface DecisionPoint {
  id: string;
  at: string; // time / context label
  prompt: string;
  options: CaseOption[];
}

export interface VitalsRow {
  t: string;
  cells: string[]; // aligns to vitalsCols
  flag?: boolean; // highlight (decision point / risk)
}

export interface PatientCase {
  id: string;
  code: string;
  title: string;
  domain: string;
  hero: boolean;
  build: "real" | "stub";
  presentation: string;
  vitalsCols: string[];
  vitals: VitalsRow[];
  decisionPoints: DecisionPoint[];
  debrief: string;
  citations: string[];
  source: string;
}

export const CASES: PatientCase[] = [
  {
    id: "idh",
    code: "Case 1",
    title: "Intradialytic hypotension (IDH)",
    domain: "Hemodynamic",
    hero: true,
    build: "real",
    presentation:
      "Mr. K, 64, diabetic, 3×/week in-center HD via AVF. Large interdialytic weight gain (+3.8 kg); UF goal 3.5 L over 4 h. Took his morning antihypertensive. 90 min in he reports lightheadedness, yawning, and a left calf cramp.",
    vitalsCols: ["SBP/DBP", "HR", "UF rate", "Symptom"],
    vitals: [
      { t: "0", cells: ["148/82", "78", "0.9 L/h", "none — took AM antihypertensive"] },
      { t: "60", cells: ["126/74", "84", "0.9 L/h", "none — refill marginal"] },
      { t: "90", cells: ["98/58", "96", "0.9 L/h", "yawning, calf cramp"], flag: true },
      { t: "95", cells: ["78/44", "108", "—", "diaphoretic, nauseated (if mismanaged)"] },
    ],
    decisionPoints: [
      {
        id: "dp1",
        at: "t = 90 · SBP 98 and falling",
        prompt: "Your first action?",
        options: [
          {
            id: "a",
            label: "Stop/reduce UF + Trendelenburg + small saline bolus",
            verdict: "correct",
            consequence:
              "SBP recovers to 112/70 by t=100; cramp eases. Stop/reduce ultrafiltration, lay the patient flat, give a measured saline bolus — but avoid excess fluid replacement (sodium overload).",
            citation: "AREP intradialytic-hypotension",
          },
          {
            id: "b",
            label: "Large 500 mL+ hypertonic/saline bolus, continue UF",
            verdict: "warning",
            consequence:
              "Transient rise then rebound; the session ends sodium-overloaded and sets up next-session hypertension and thirst. Excess fluid replacement should be avoided.",
            citation: "AREP intradialytic-hypotension",
          },
          {
            id: "c",
            label: "Do nothing — let it ride",
            verdict: "wrong",
            consequence:
              "t=95 SBP 78/44, near-syncope, session aborted. IDH is not benign — it carries myocardial stunning and hypoperfusion risk.",
            citation: "HV-HDF Handbook; Burton 2009 CJASN PMID 19357245",
          },
        ],
      },
      {
        id: "dp2",
        at: "Post-recovery · plan the NEXT session",
        prompt: "Which prevention approach?",
        options: [
          {
            id: "a",
            label:
              "Bundle: lower UF rate / longer time, hold AM antihypertensive on dialysis days, cool/isothermic dialysate, accurate dry weight, judicious ↑ dialysate Ca, midodrine pre-dialysis if recurrent",
            verdict: "correct",
            consequence:
              "Addresses the multifactorial causes (plasma-refill vs UF rate, autonomic dysfunction, thermal balance). This — not heroic rescue — is the win.",
            citation: "AREP intradialytic-hypotension",
          },
          {
            id: "b",
            label: "Just set a permanently higher dialysate sodium",
            verdict: "wrong",
            consequence:
              "Sodium profiling must maintain zero sodium balance. Chronic high dialysate Na drives thirst, weight gain, and hypertension.",
            citation: "AREP intradialytic-hypotension",
          },
        ],
      },
      {
        id: "dp3",
        at: "Recurrent IDH despite the bundle · the device bridge",
        prompt: "What modality change reduces hypotension?",
        options: [
          {
            id: "a",
            label: "Convective therapy / online-HDF with cool dialysate",
            verdict: "correct",
            consequence:
              "Extensive use of convection plus thermal control improves vascular stability and can prevent symptomatic hypotension. Device note: online-HDF needs a 5008S/6008-class machine (IFU-pending); a 4008S cannot deliver it.",
            citation: "AREP intradialytic-hypotension; Maggiore 2002 AJKD PMID 12148100",
          },
          {
            id: "b",
            label: "Add a vasopressor and keep standard HD",
            verdict: "warning",
            consequence:
              "Treats the episode, not the mechanism. The durable fix is the prevention bundle + a convective modality.",
            citation: "AREP intradialytic-hypotension",
          },
        ],
      },
    ],
    debrief:
      "IDH is multifactorial — plasma-refill vs UF rate, autonomic dysfunction, cardiac reserve, thermal balance. The win is the prevention bundle + modality, not heroic rescue. Outcome tie-in: CONVINCE showed lower IDH incidence with high-volume HDF vs high-flux HD — so the device story and the patient story are the same story.",
    citations: ["AREP intradialytic-hypotension.html", "Karaboyas 2017 AJKD PMID 28526352", "CONVINCE (Blankestijn 2023 NEJM DOI 10.1056/NEJMoa2304820)"],
    source: "AREP intradialytic-complications · various intradialytic episodes",
  },
  {
    id: "cardiac",
    code: "Case 2",
    title: "Arrhythmia & the low-dialysate-K trap",
    domain: "Cardiac",
    hero: false,
    build: "stub",
    presentation:
      "Mrs. R, 71, ischemic heart disease + LVH, on digoxin. Predialysis serum K⁺ 4.6 mmol/L (low-normal). Standing order has dialysate K⁺ mis-set to 1.0 mmol/L. Two hours in: palpitations, then a run of ventricular ectopy.",
    vitalsCols: ["Rhythm", "HR", "SBP", "Serum K⁺"],
    vitals: [
      { t: "0", cells: ["sinus", "72", "138/80", "4.6 — digoxin + dialysate K 1.0"] },
      { t: "90", cells: ["occ. PVC", "80", "130/78", "3.4 — rapid K removal"] },
      { t: "120", cells: ["PVCs, couplets", "96", "120/74", "2.9"], flag: true },
      { t: "130", cells: ["NSVT run", "—", "—", "2.6 (if mismanaged)"] },
    ],
    decisionPoints: [
      {
        id: "dp1",
        at: "t = 120 · PVCs + couplets",
        prompt: "First step?",
        options: [
          {
            id: "a",
            label: "Draw electrolytes/EKG/O2; correct K/Ca/Mg; raise dialysate K toward 3–3.5 mEq/L",
            verdict: "correct",
            consequence:
              "Ectopy settles. Digitalis patients may need dialysate K 3–3.5 mEq/L to prevent hypokalemia — fix the cause, not just the rhythm.",
            citation: "AREP cardiac-arrhythmias",
          },
          {
            id: "b",
            label: "Push amiodarone, leave dialysate K at 1.0",
            verdict: "warning",
            consequence: "Treats the rhythm but not the root cause; it recurs.",
            citation: "AREP cardiac-arrhythmias",
          },
          {
            id: "c",
            label: "Continue unchanged",
            verdict: "wrong",
            consequence:
              "t=130 NSVT. In a digoxin + low-normal-K patient on a 1K bath this is the sudden-death pathway — sudden death is associated with dialysate K <2 mmol/L in patients with low-to-normal predialysis K.",
            citation: "Karaboyas 2017 AJKD PMID 28526352",
          },
        ],
      },
    ],
    debrief:
      "The dialysate prescription is a drug — a low-K bath in the wrong patient is a sudden-death risk factor, not a neutral default. (Full case in the production build.)",
    citations: ["AREP cardiac-arrhythmias.html", "Karaboyas 2017 AJKD PMID 28526352"],
    source: "AREP intradialytic-complications · cardiac",
  },
  {
    id: "hyperk",
    code: "Case 3",
    title: "Severe hyperkalemia → ECG cascade",
    domain: "Electrolytes",
    hero: false,
    build: "stub",
    presentation:
      "Mr. T, 58, missed his last two sessions, large potassium intake. Unscheduled session: weak, palpitations, paresthesias. Point-of-care K⁺ 7.2 mmol/L. Monitor: tented T waves, QRS beginning to widen.",
    vitalsCols: ["Serum K⁺", "ECG"],
    vitals: [
      { t: "0 (pre)", cells: ["7.2", "tented T, early QRS widening"], flag: true },
      { t: "+10", cells: ["7.0", "T less peaked after Ca"] },
      { t: "+30", cells: ["5.9", "QRS normalizing — shift + HD started"] },
      { t: "+120", cells: ["4.6", "normal — HD removed 70–150 mEq"] },
    ],
    decisionPoints: [
      {
        id: "dp1",
        at: "K 7.2 with ECG changes · before the dialyzer clears anything",
        prompt: "Order of operations?",
        options: [
          {
            id: "a",
            label: "IV calcium FIRST (stabilize) → insulin+glucose / albuterol (shift) → start HD (remove)",
            verdict: "correct",
            consequence:
              "Three levels: stabilize the membrane (calcium), shift K intracellularly (insulin/albuterol), remove K (HD — 70–150 mEq, the gold standard).",
            citation: "AREP hyperkalemia; Bansal & Pergola 2020 KIR PMID 32518860",
          },
          {
            id: "b",
            label: "Start HD immediately, skip calcium",
            verdict: "warning",
            consequence:
              "Clears K over time but leaves the heart unprotected in the highest-risk first minutes — dangerous with QRS widening.",
            citation: "AREP hyperkalemia",
          },
          {
            id: "c",
            label: "Give bicarbonate alone and wait",
            verdict: "wrong",
            consequence:
              "Slow and unreliable as monotherapy; the ECG progresses (wide QRS → AV block → sine wave → VF).",
            citation: "AREP hyperkalemia",
          },
        ],
      },
    ],
    debrief:
      "Hyperkalemia is asymptomatic until it isn't — the ECG is the vital sign. Calcium buys time; it does not lower K. HD is definitive. (Full case in the production build.)",
    citations: ["AREP hyperkalemia.html", "Bansal & Pergola 2020 PMID 32518860"],
    source: "AREP intradialytic-complications · electrolytes",
  },
  {
    id: "acidosis",
    code: "Case 4",
    title: "Accidental metabolic acidosis (concentrate error)",
    domain: "Acid–base",
    hero: false,
    build: "stub",
    presentation:
      "Mid-session, three patients on one water loop report dyspnea, nausea, and air hunger within ~20 min of each other. A new batch of acid concentrate was connected that morning. One machine's conductivity reads borderline.",
    vitalsCols: ["Signal"],
    vitals: [
      { t: "0", cells: ["new acid concentrate connected (logged)"] },
      { t: "90", cells: ["air hunger, Kussmaul breathing"], flag: true },
      { t: "95", cells: ["venous pH trending down; conductivity borderline"] },
      { t: "110", cells: ["hemodynamic instability (if missed)"] },
    ],
    decisionPoints: [
      {
        id: "dp1",
        at: "A cluster of symptomatic patients on one loop",
        prompt: "First move?",
        options: [
          {
            id: "a",
            label: "Suspect a dialysate/concentrate error: stop the affected treatments, check conductivity + connections, draw a blood gas",
            verdict: "correct",
            consequence:
              "A symptom cluster on a shared loop = think machine/water/concentrate, not patient. Accidental acidosis comes from wrong acid/base ratios or concentrate substitution; conductivity checks are vital.",
            citation: "AREP metabolic-acidosis",
          },
          {
            id: "b",
            label: "Treat each patient's 'anxiety' individually and continue",
            verdict: "wrong",
            consequence: "Misses the systemic cause; the next patients on the loop are exposed.",
            citation: "AREP metabolic-acidosis",
          },
        ],
      },
    ],
    debrief:
      "A symptom cluster on a shared loop means machine/water/concentrate. Acid-base errors are rare but rapidly dangerous and preventable by interlocks staff must trust and verify. (Full case in the production build.)",
    citations: ["AREP metabolic-acidosis.html"],
    source: "AREP intradialytic-complications · acid–base",
  },
];

export function scoreFor(verdict: Verdict): number {
  return verdict === "correct" ? 1 : verdict === "warning" ? 0.5 : 0;
}
