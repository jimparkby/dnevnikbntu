// Thin routing glue required by Next.js (route handlers must live under app/api/**).
// The actual logic lives in backend/api/faculties.ts.
// `dynamic` must be declared directly in this file — Next's build-time analyzer
// reads route segment config statically and does not follow re-exports for it.
export const dynamic = "force-dynamic";
export { GET } from "@/backend/api/faculties";
