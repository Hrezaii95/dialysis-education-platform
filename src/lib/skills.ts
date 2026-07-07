export interface SkillNode {
  id: string;
  title: string;
  description: string;
  href: string;
  prerequisites: string[];
  icon: string;
}

export const SKILL_TREE: SkillNode[] = [
  {
    id: "foundation",
    title: "HDF Clinical Foundation",
    description: "Mechanisms, middle molecules, CONVINCE evidence",
    href: "/flipbook?page=m1-p1",
    prerequisites: [],
    icon: "🧬",
  },
  {
    id: "circuit",
    title: "Pump the Circuit",
    description: "PhET-style fluid circuit manipulation",
    href: "/simulator?step=explore&view=circuit",
    prerequisites: ["foundation"],
    icon: "💉",
  },
  {
    id: "monitor",
    title: "5008 Monitor Mastery",
    description: "Operate treatment screen, read TMP & convection",
    href: "/simulator?step=explore&view=monitor",
    prerequisites: ["circuit"],
    icon: "🖥️",
  },
  {
    id: "cases",
    title: "Patient Case Lab",
    description: "Branching scenarios with consequence debrief",
    href: "/simulator?step=cases",
    prerequisites: ["monitor"],
    icon: "🩺",
  },
  {
    id: "alarms",
    title: "Alarm Response",
    description: "8 critical alarms with audio + checklist",
    href: "/simulator?step=alarms",
    prerequisites: ["monitor"],
    icon: "🔔",
  },
  {
    id: "devices",
    title: "3D Device Configurator",
    description: "5008 family + FX CorAL dialyzer",
    href: "/simulator?step=explore&view=operate",
    prerequisites: ["foundation"],
    icon: "⚙️",
  },
  {
    id: "convince",
    title: "CONVINCE Explorer",
    description: "Interactive dose-response & mortality data",
    href: "/convince",
    prerequisites: ["foundation"],
    icon: "📊",
  },
  {
    id: "credential",
    title: "Clinical Credential",
    description: "Mastery assessment + xAPI record",
    href: "/assessment",
    prerequisites: ["cases", "alarms", "convince"],
    icon: "🎓",
  },
];
