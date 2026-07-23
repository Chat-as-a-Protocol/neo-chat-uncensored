// Deep health check (server-side).
// Diferente de /health (raso, usado pelo Railway), esta rota valida a cadeia
// frontend -> backend pingando BACKEND_URL/health na rede privada.
// BACKEND_URL roda APENAS no servidor; nunca é exposto ao browser.

const BACKEND_TIMEOUT_MS = 5000;

function resolveBackendUrl(): string | null {
  // import.meta.env cobre dev (Vite) e SSR; process.env cobre runtime no Railway.
  const fromEnv =
    (import.meta.env.BACKEND_URL as string | undefined) ?? process.env.BACKEND_URL;
  const raw = (fromEnv || "").trim().replace(/\/$/, "");
  if (!raw) return null;
  // Garante protocolo; rede privada do Railway normalmente é http interno.
  return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
}

export const GET = async () => {
  const timestamp = new Date().toISOString();
  const backendUrl = resolveBackendUrl();

  if (!backendUrl) {
    return json(503, {
      status: "degraded",
      backend: "unconfigured",
      detail: "BACKEND_URL não definido",
      timestamp,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return json(503, {
        status: "degraded",
        backend: "down",
        detail: `backend respondeu ${res.status}`,
        timestamp,
      });
    }

    const body = await res.json().catch(() => ({}));
    return json(200, {
      status: "ok",
      backend: "ok",
      backendStatus: body?.status ?? "ok",
      uptime: body?.uptime,
      timestamp,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return json(503, {
      status: "degraded",
      backend: "down",
      detail: aborted ? `timeout após ${BACKEND_TIMEOUT_MS}ms` : "backend inacessível",
      timestamp,
    });
  } finally {
    clearTimeout(timer);
  }
};

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
