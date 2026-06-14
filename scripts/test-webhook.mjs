import crypto from "crypto";

const WEBHOOK_SECRET = process.env.FLOWPAY_WEBHOOK_SECRET || "2b2e8f8d54f8ee16be1c4df2246ebafee41e2d981da4352843aa19571b8501c8";
const TARGET_URL = process.env.WEBHOOK_URL || "https://api.noxai.chat/api/webhooks/flowpay";

// user_98af9e5ded7750f2b8a64c48fb7e48d1 = nettoaeb1@gmail.com
const USER_ID = "user_98af9e5ded7750f2b8a64c48fb7e48d1";
const PACKAGE_ID = "1k";
const UNIQUE_ID = `test_${Date.now()}`;
const REFERENCE = `nox_tokens_${PACKAGE_ID}_${UNIQUE_ID}`;

const payload = JSON.stringify({
  event: "FLOWPAY:PAYMENT_RECEIVED",
  data: {
    reference: REFERENCE,
    paymentId: `pay_${UNIQUE_ID}`,
    amount: 49,
    currency: "BRL",
    status: "received",
    metadata: {
      userId: USER_ID,
      packageId: PACKAGE_ID,
    },
  },
});

const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

console.log(`\nEnviando webhook de teste`);
console.log(`  URL:       ${TARGET_URL}`);
console.log(`  Reference: ${REFERENCE}`);
console.log(`  UserId:    ${USER_ID}`);
console.log(`  Package:   ${PACKAGE_ID} (1000 tokens, R$49)\n`);

const res = await fetch(TARGET_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Nexus-Signature": signature,
  },
  body: payload,
});

const body = await res.text();
console.log(`Status: ${res.status}`);
console.log(`Body:   ${body}`);
