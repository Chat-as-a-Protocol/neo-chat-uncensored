const DEFAULT_FLOWPAY_API_URL = "https://api.flowpay.cash";

const normalizeBaseUrl = (value) =>
  String(value || DEFAULT_FLOWPAY_API_URL).trim().replace(/\/+$/, "");

const bodyPreview = (body) =>
  String(body || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

const hostFromUrl = (value) => {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
};

const appHostsFromEnv = (env) => [
  ...String(env.FRONTEND_URL || "").split(","),
  env.PUBLIC_API_URL,
  env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : null,
];

const isSameAppHost = (apiHost, appHost) => {
  if (!apiHost || !appHost) return false;
  const rootHost = appHost.replace(/^www\./, "");
  return apiHost === appHost || apiHost === `api.${rootHost}`;
};

export class FlowPayApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "FlowPayApiError";
    this.statusCode = options.statusCode || 500;
    this.providerStatus = options.providerStatus || null;
    this.providerBodyPreview = options.providerBodyPreview || null;
  }
}

export const resolveFlowPayApiUrl = (env = process.env) => {
  const apiUrl = normalizeBaseUrl(env.FLOWPAY_API_URL);
  let apiHost;

  try {
    apiHost = new URL(apiUrl).host.toLowerCase();
  } catch {
    throw new FlowPayApiError("FLOWPAY_API_URL is invalid", {
      statusCode: 503,
    });
  }

  const appHosts = appHostsFromEnv(env).map(hostFromUrl).filter(Boolean);
  if (appHosts.some((appHost) => isSameAppHost(apiHost, appHost))) {
    throw new FlowPayApiError("FLOWPAY_API_URL points to this app instead of FlowPay", {
      statusCode: 503,
    });
  }

  return apiUrl;
};

const resolveFlowPayApiKey = (env = process.env) => {
  const apiKey = String(env.FLOWPAY_API_KEY || "").trim();
  if (!apiKey) {
    throw new FlowPayApiError("FLOWPAY_API_KEY is not configured", {
      statusCode: 503,
    });
  }
  return apiKey;
};

const readFlowPayJson = async (response) => {
  const rawBody = await response.text();
  let data = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new FlowPayApiError("FlowPay returned a non-JSON response", {
        providerStatus: response.status,
        providerBodyPreview: bodyPreview(rawBody),
      });
    }
  }

  if (!response.ok) {
    throw new FlowPayApiError(
      data.error || data.message || `FlowPay request failed with ${response.status}`,
      {
        providerStatus: response.status,
        providerBodyPreview: bodyPreview(rawBody),
      },
    );
  }

  return data;
};

export const formatFlowPayError = (error) => ({
  message: error.message,
  providerStatus: error.providerStatus || undefined,
  providerBodyPreview: error.providerBodyPreview || undefined,
});

export const normalizeFlowPayChargeResponse = (data = {}) => {
  const pixData = data.pixData || data.pix_data || null;
  const normalizedPixData = pixData && typeof pixData === "object"
    ? {
        qrCode: pixData.qrCode || pixData.qr_code || null,
        brCode: pixData.brCode || pixData.br_code || null,
        correlationId:
          pixData.correlationId ||
          pixData.correlation_id ||
          data.chargeId ||
          data.id_transacao ||
          null,
        value: pixData.value ?? null,
        expiresAt: pixData.expiresAt || pixData.expires_at || null,
        status: pixData.status || null,
      }
    : null;

  return {
    checkoutUrl: data.checkoutUrl || null,
    chargeId:
      data.chargeId ||
      data.id_transacao ||
      normalizedPixData?.correlationId ||
      null,
    pixData: normalizedPixData,
  };
};

export const createFlowPayCharge = async (
  payload,
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) => {
  const apiUrl = resolveFlowPayApiUrl(env);
  const apiKey = resolveFlowPayApiKey(env);

  // Detectar se é uma chave Basic (Client_Id:Client_Secret em Base64)
  const isBasicAuth = apiKey.startsWith('Q2xp');
  const authHeader = isBasicAuth ? `Basic ${apiKey}` : `Bearer ${apiKey}`;

  const response = await fetchImpl(`${apiUrl}/api/create-charge`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readFlowPayJson(response);
  const normalized = normalizeFlowPayChargeResponse(data);
  if (!normalized.checkoutUrl && !normalized.pixData?.brCode && !normalized.pixData?.qrCode) {
    throw new FlowPayApiError("FlowPay response missing checkoutUrl or pixData", {
      providerStatus: response.status,
      providerBodyPreview: JSON.stringify(data).slice(0, 180),
    });
  }

  return normalized;
};

export const checkFlowPayHealth = async (
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) => {
  const apiUrl = resolveFlowPayApiUrl(env);
  const apiKey = resolveFlowPayApiKey(env);

  const response = await fetchImpl(`${apiUrl}/api/health`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
  };
};
