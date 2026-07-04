/**
 * Base-path helper for static deployments under a sub-path (e.g. GitHub Pages).
 *
 * Next's <Link> and router handle basePath automatically, but plain
 * <img src="/...">, <video>, <object> and fetch("/...") do not.
 * The CI workflow sets NEXT_PUBLIC_BASE_PATH (e.g. "/dialysis-education-platform");
 * local dev builds leave it unset so paths stay root-relative.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
