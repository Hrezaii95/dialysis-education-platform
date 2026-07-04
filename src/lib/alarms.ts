export interface AlarmSpec {
  id: string;
  code: string;
  name: string;
  severity: "critical" | "warning";
  firstResponse: string[];
  mechanism: string;
  frequency: number;
}

export const ALARM_CATALOG: AlarmSpec[] = [
  {
    id: "tmp_high",
    code: "TMP_HIGH",
    name: "High TMP / Clot Risk",
    severity: "critical",
    firstResponse: [
      "Pause convection; assess filtration fraction",
      "Check blood flow and access patency",
      "Inspect dialyzer for visible clot",
      "Consider saline flush per unit protocol",
    ],
    mechanism: "Elevated transmembrane pressure indicates hemoconcentration at filter outlet — often from high FF or low Qb.",
    frequency: 880,
  },
  {
    id: "venous_pressure",
    code: "VENOUS_PRESSURE",
    name: "Venous Pressure Drop",
    severity: "critical",
    firstResponse: [
      "Check venous needle position and connections",
      "Inspect for kinked blood line",
      "Verify patient position and arm movement",
      "Activate VAM if available",
    ],
    mechanism: "Sudden venous pressure drop may indicate needle dislodgement or line occlusion.",
    frequency: 660,
  },
  {
    id: "access_flow",
    code: "ACCESS_FLOW_LOW",
    name: "Access Flow Insufficient",
    severity: "warning",
    firstResponse: [
      "Measure access flow per protocol",
      "Reduce convection target temporarily",
      "Coordinate with nephrology for access evaluation",
      "Document for care plan review",
    ],
    mechanism: "Convection ≥23 L requires adequate access flow; low flow limits HDF dosing.",
    frequency: 520,
  },
  {
    id: "hypotension",
    code: "HYPOTENSION",
    name: "Intradialytic Hypotension",
    severity: "critical",
    firstResponse: [
      "Trendelenburg position if symptomatic",
      "Reduce UF rate; pause convection",
      "Administer saline per protocol",
      "Review dry weight and cardiovascular status",
    ],
    mechanism: "HDF increases volume shift; fragile patients need conservative convection.",
    frequency: 440,
  },
  {
    id: "air_detect",
    code: "AIR_DETECT",
    name: "Air Detected in Circuit",
    severity: "critical",
    firstResponse: [
      "Clamp arterial line immediately",
      "Stop blood pump",
      "Inspect connections and drip chamber level",
      "Prime affected segment before restart",
    ],
    mechanism: "Air embolism risk requires immediate pump stop and line inspection.",
    frequency: 990,
  },
  {
    id: "blood_leak",
    code: "BLOOD_LEAK",
    name: "Blood Leak Detector",
    severity: "critical",
    firstResponse: [
      "Stop treatment per protocol",
      "Replace dialyzer",
      "Document incident",
      "Notify charge nurse and nephrologist",
    ],
    mechanism: "Membrane breach triggers blood leak alarm — dialyzer must be replaced.",
    frequency: 770,
  },
  {
    id: "conductivity",
    code: "CONDUCTIVITY",
    name: "Dialysate Conductivity",
    severity: "warning",
    firstResponse: [
      "Verify dialysate concentrate connection",
      "Run conductivity check per IFU",
      "Do not continue until within range",
    ],
    mechanism: "Incorrect dialysate composition risks electrolyte imbalance.",
    frequency: 600,
  },
  {
    id: "substitution",
    code: "SUBSTITUTION",
    name: "Substitution Fluid Alarm",
    severity: "warning",
    firstResponse: [
      "Check DIASAFE®plus status and ONLINE pathway",
      "Verify substitution fluid generation",
      "Review HDF prescription settings",
    ],
    mechanism: "Online substitution requires ultrapure fluid path integrity.",
    frequency: 550,
  },
];
