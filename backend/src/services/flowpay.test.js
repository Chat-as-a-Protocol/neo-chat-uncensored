import assert from "node:assert";
import test, { describe } from "node:test";
import {
  createFlowPayCharge,
  resolveFlowPayApiUrl,
} from "./flowpay.js";

describe("FlowPay Service - URL contract", () => {
  test("uses FlowPay canonical URL by default", () => {
    assert.strictEqual(
      resolveFlowPayApiUrl({}),
      "https://api.flowpay.cash",
    );
  });

  test("rejects api.noxai.chat even without app URL envs", () => {
    assert.throws(
      () =>
        resolveFlowPayApiUrl({
          FLOWPAY_API_URL: "https://api.noxai.chat",
        }),
      /never api\.noxai\.chat/,
    );
  });

  test("rejects self-call derived from FRONTEND_URL", () => {
    assert.throws(
      () =>
        resolveFlowPayApiUrl({
          FLOWPAY_API_URL: "https://api.noxai.chat",
          FRONTEND_URL: "https://noxai.chat",
        }),
      /never api\.noxai\.chat|instead of FlowPay/,
    );
  });
});

describe("FlowPay Service - service orders contract", () => {
  test("creates PIX orders with bearer service auth and normalized payload", async () => {
    const calls = [];
    const data = await createFlowPayCharge(
      {
        valor: 19.9,
        product_id: "nox_tokens_10k",
        customer_name: "Nox Test",
        customer_email: "nox-test@example.com",
        metadata: { packageId: "10k" },
      },
      {
        env: {
          FLOWPAY_API_URL: "https://api.flowpay.cash",
          FLOWPAY_API_KEY: "service-account-key",
        },
        fetchImpl: async (url, options) => {
          calls.push({ url, options });
          return new Response(
            JSON.stringify({
              pix_data: {
                br_code: "000201010212",
                qr_code: "data:image/png;base64,abc",
                correlation_id: "corr_123",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        },
      },
    );

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(
      calls[0].url,
      "https://api.flowpay.cash/api/service/orders",
    );
    assert.deepStrictEqual(calls[0].options.headers, {
      "Content-Type": "application/json",
      Authorization: "Bearer service-account-key",
    });
    assert.deepStrictEqual(JSON.parse(calls[0].options.body), {
      amount_brl: 19.9,
      product_name: "nox_tokens_10k",
      product_ref: "nox_tokens_10k",
      customer_name: "Nox Test",
      customer_email: "nox-test@example.com",
      metadata: { packageId: "10k" },
    });
    assert.deepStrictEqual(data.pixData, {
      brCode: "000201010212",
      qrCode: "data:image/png;base64,abc",
      correlationId: "corr_123",
      value: null,
      expiresAt: null,
      status: null,
    });
    assert.strictEqual(data.chargeId, "corr_123");
  });
});
