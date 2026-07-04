import { COMPETENCIES } from "@/lib/competencies";
import CompetencyDetailClient from "./CompetencyDetailClient";

/** Static export: enumerate every competency detail route (c1–c6). */
export function generateStaticParams() {
  return COMPETENCIES.map((c) => ({ id: c.id }));
}

export default function CompetencyDetailPage() {
  return <CompetencyDetailClient />;
}
