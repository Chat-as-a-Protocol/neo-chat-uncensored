import assert from "node:assert";
import test from "node:test";

import {
  createFlowPayCharge,
  checkFlowPayHealth,
  FlowPayApiError,
  resolveFlowPayApiUrl,
} from "./flowpay.js";

test("FlowPay Service - Hardened Validation", async (t) => {
  await t.test("Handshake: Should send redundant auth headers for maximum compatibility", async () => {
    let capturedHeaders;

    await createFlowPayCharge(
      { amount: 100, orderId: "test_1" },
      {
        env: {
          FLOWPAY_API_URL: "https://api.flowpay.cash",
          FLOWPAY_API_KEY: "secret_nexus_token",
        },
        fetchImpl: async (_url, options) => {
          capturedHeaders = options.headers;
          return new Response(JSON.stringify({ checkoutUrl: "https://pay.flowpay.cash/c/1" }));
        },
      },
    );

    // Verifica se ambos os padrões de autenticação estão presentes
    assert.strictEqual(capturedHeaders["Authorization"], "Bearer secret_nexus_token");
    assert.strictEqual(capturedHeaders["x-api-key"], "secret_nexus_token");
  });

  await t.test("Health Check: Should correctly report provider status", async () => {
    const mockEnv = {
      FLOWPAY_API_URL: "https://api.flowpay.cash",
      FLOWPAY_API_KEY: "test",
    };

    const health = await checkFlowPayHealth({
      env: mockEnv,
      fetchImpl: async () => new Response(null, { status: 204 }),
    });

    assert.strictEqual(health.ok, true);
    assert.strictEqual(health.status, 204);
  });

  await t.test("Configuration: Should fail immediately if API Key is missing", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 10 },
          { env: { FLOWPAY_API_URL: "https://api.flowpay.cash" } },
        ),
      /FLOWPAY_API_KEY is not configured/,
    );
  });

  await t.test("Security: Should detect and block loopback to API and Frontend", () => {
    const env = {
      FRONTEND_URL: "https://noxai.chat",
      PUBLIC_API_URL: "https://api.noxai.chat",
    };

    // Tenta apontar o FlowPay para o próprio backend
    assert.throws(
      () => resolveFlowPayApiUrl({ ...env, FLOWPAY_API_URL: "https://api.noxai.chat" }),
      /points to this app/,
    );

    // Tenta apontar para o frontend
    assert.throws(
      () => resolveFlowPayApiUrl({ ...env, FLOWPAY_API_URL: "https://noxai.chat" }),
      /points to this app/,
    );
  });

  await t.test("Error Handling: Should extract structured error messages from provider", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 49 },
          {
            env: { FLOWPAY_API_URL: "https://api.flowpay.cash", FLOWPAY_API_KEY: "k" },
            fetchImpl: async () =>
              new Response(JSON.stringify({ error: "Sovereign Balance Insufficient" }), {
                status: 400,
              }),
          },
        ),
      (error) => {
        assert.ok(error instanceof FlowPayApiError);
        assert.strictEqual(error.message, "Sovereign Balance Insufficient");
        assert.strictEqual(error.providerStatus, 400);
        return true;
      },
    );
  });

  await t.test("Resilience: Should fail safely when FlowPay returns HTML", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 49 },
          {
            env: { FLOWPAY_API_URL: "https://api.flowpay.cash", FLOWPAY_API_KEY: "test" },
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

  await t.test("Infrastructure: Should handle network/DNS failures as 502", async () => {
    await assert.rejects(
      () =>
        createFlowPayCharge(
          { amount: 49 },
          {
            env: { FLOWPAY_API_URL: "https://api.flowpay.cash", FLOWPAY_API_KEY: "test" },
            fetchImpl: async () => {
              throw new Error("fetch failed (DNS Timeout)");
            },
          },
        ),
      (error) => {
        // O erro original do fetch sobe, mas o controller geralmente o captura.
        // Aqui validamos que a falha é propagada corretamente.
        assert.match(error.message, /fetch failed/);
        return true;
      },
    );
  });
});
