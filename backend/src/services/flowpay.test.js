import assert from "node:assert";
import test from "node:test";

import {
  createFlowPayCharge,
  FlowPayApiError,
  resolveFlowPayApiUrl,
} from "./flowpay.js";

test("FlowPay Service", async (t) => {
  await t.test("should normalize API URL and create a charge", async () => {
    let capturedRequest;

    const data = await createFlowPayCharge(
      { amount: 49, orderId: "tokens_test" },
      {
        env: {
          FLOWPAY_API_URL: "https://api.flowpay.cash/",
          FLOWPAY_API_KEY: "test_key",
        },
        fetchImpl: async (url, options) => {
          capturedRequest = { url, options };
          return new Response(JSON.stringify({ checkoutUrl: "https://pay.test/checkout" }), {
            status: 200,
          });
        },
      },
    );

    assert.strictEqual(resolveFlowPayApiUrl({ FLOWPAY_API_URL: "https://api.flowpay.cash/" }), "https://api.flowpay.cash");
    assert.strictEqual(capturedRequest.url, "https://api.flowpay.cash/api/create-charge");
    assert.strictEqual(capturedRequest.options.headers.Authorization, "Bearer test_key");
    assert.deepStrictEqual(JSON.parse(capturedRequest.options.body), {
      amount: 49,
      orderId: "tokens_test",
    });
    assert.strictEqual(data.checkoutUrl, "https://pay.test/checkout");
  });

  await t.test("should reject app domains as FlowPay API URL", () => {
    assert.throws(
      () =>
        resolveFlowPayApiUrl({
          FLOWPAY_API_URL: "https://api.noxai.chat",
          FRONTEND_URL: "https://noxai.chat",
        }),
      /points to this app/,
    );
  });

  await t.test("should fail safely when FlowPay returns HTML", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 49 },
          {
            env: {
              FLOWPAY_API_URL: "https://api.flowpay.cash",
              FLOWPAY_API_KEY: "test_key",
            },
            fetchImpl: async () =>
              new Response("<!doctype html><html><body>Not found</body></html>", {
                status: 404,
              }),
          },
        ),
      (error) => {
        assert.ok(error instanceof FlowPayApiError);
        assert.strictEqual(error.providerStatus, 404);
        assert.match(error.providerBodyPreview, /doctype html/i);
        assert.match(error.message, /non-JSON/i);
        return true;
      },
    );
  });

  await t.test("should require a checkoutUrl in successful responses", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 49 },
          {
            env: {
              FLOWPAY_API_URL: "https://api.flowpay.cash",
              FLOWPAY_API_KEY: "test_key",
            },
            fetchImpl: async () => new Response(JSON.stringify({ id: "charge_1" }), { status: 200 }),
          },
        ),
      (error) => {
        assert.ok(error instanceof FlowPayApiError);
        assert.match(error.message, /missing checkoutUrl/i);
        return true;
      },
    );
  });
});
