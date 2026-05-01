import { query } from "../utils/db.js";

export const paymentService = {
  async recordFlowPayPayment({
    providerReference,
    userId,
    amountBrl,
    currency = "BRL",
    status = "received",
    metadata = {},
  }) {
    if (!process.env.DATABASE_URL) {
      return { persisted: false, reason: "database_unconfigured" };
    }

    const result = await query(
      `INSERT INTO payments (
        provider,
        provider_reference,
        user_id,
        amount_brl,
        currency,
        status,
        metadata
      )
      VALUES ('flowpay', $1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (provider_reference)
      DO UPDATE SET
        status = EXCLUDED.status,
        metadata = payments.metadata || EXCLUDED.metadata
      RETURNING id, provider_reference, user_id, amount_brl, currency, status, metadata, created_at`,
      [
        providerReference,
        userId,
        Number.isFinite(amountBrl) ? amountBrl : 0,
        currency,
        status,
        JSON.stringify(metadata),
      ],
    );

    return { persisted: true, payment: result.rows[0] };
  },
};
