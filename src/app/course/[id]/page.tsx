import { COMPETENCIES } from "@/lib/competencies";
import CoursePageClient from "./CoursePageClient";

/** Static export: enumerate every course route (c1–c6). Competencies without a
 *  built course render the client fallback ("Course in the production build"). */
export function generateStaticParams() {
  return COMPETENCIES.map((c) => ({ id: c.id }));
}

export default function CoursePage() {
  return <CoursePageClient />;
}
