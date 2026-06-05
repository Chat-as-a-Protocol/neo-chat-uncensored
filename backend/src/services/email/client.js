import { FROM_EMAIL, RESEND_API_URL } from "./config.js";
import { assertEmail } from "./validators.js";

const normalizeEmailPayload = (payload) => {
  assertEmail(payload?.to);

  return {
    ...payload,
    from: payload.from || FROM_EMAIL,
  };
};

export const sendEmail = async (payload) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] Resend API Key is missing. Email skipped.");
    return { skipped: true, reason: "resend_api_key_missing" };
  }

  const safePayload = normalizeEmailPayload(payload);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(safePayload),
  });

  const responseText = await response.text();
  let data = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Resend email failed (${response.status}): ${responseText.substring(0, 100)}`,
    );
  }

  return { skipped: false, data };
};
