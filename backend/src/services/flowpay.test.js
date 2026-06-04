import assert from "node:assert";
import test, { describe } from "node:test";
import { resolveFlowPayApiUrl } from "./flowpay.js";

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
