export const RESEND_API_URL =
  process.env.RESEND_API_URL || "https://api.resend.com/emails";

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "NØX <send@noxai.chat>";

export const FRONTEND_URL = (process.env.FRONTEND_URL || "https://noxai.chat")
  .split(",")[0]
  .trim()
  .replace(/\/$/, "");
