import assert from "node:assert";
import test, { afterEach, beforeEach, describe } from "node:test";
import { emailService } from "./email.js";

describe("Email Service - hardening", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test_resend_key";
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }

    global.fetch = originalFetch;
  });

  test("rejects invalid recipient before calling Resend", async () => {
    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return { ok: true, text: async () => "{}" };
    };

    await assert.rejects(
      emailService.sendWelcomeEmail("invalid-recipient", {
        userName: "Operador",
      }),
      /Destinatário inválido ou ausente/,
    );

    assert.strictEqual(fetchCalled, false);
  });

  test("escapes feature announcement HTML while preserving bold markdown", async () => {
    let requestBody = null;
    global.fetch = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { ok: true, text: async () => "{}" };
    };

    await emailService.sendFeatureAnnouncement("nox@noxai.chat", {
      userName: "<Operador>",
      title: "<b>Campanha</b>",
      content: "<img src=x onerror=alert(1)>\n**Acesso liberado**",
      actionLabel: "Abrir <NØX>",
      actionUrl: "https://noxai.chat",
    });

    assert.match(requestBody.subject, /&lt;b&gt;Campanha&lt;\/b&gt;/);
    assert.doesNotMatch(requestBody.html, /<img src=x/i);
    assert.match(requestBody.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(requestBody.html, /<strong>Acesso liberado<\/strong>/);
    assert.match(requestBody.html, /Abrir &lt;NØX&gt;/);
  });
});
