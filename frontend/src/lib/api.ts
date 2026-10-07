import { healthResponseSchema } from "@qforge/shared";

const apiUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3002").replace(/\/$/, "");

export async function fetchHealth() {
  const response = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}.`);
  return healthResponseSchema.parse(await response.json());
}
