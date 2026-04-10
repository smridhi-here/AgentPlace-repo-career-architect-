const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchBackendHealth() {
  const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });

  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.status}`);
  }

  return res.json() as Promise<{ status: string; service: string }>;
}