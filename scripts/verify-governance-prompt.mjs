// NØX Governance Checker (step 7).
// Mirrors the composition of the finalSystemPrompt in backend/src/server.js and proves:
// 1. presence of governance blocks;
// 2. order (Constitution last — authority/recency);
// 3. decontamination (old debt terms absent);
// 4. absence of "chat.ts" in files promoted to shared/;
// 5. fail-closed: loadRequiredGovernanceFile throws empty/missing file.
// No network, no auth, no quota.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SHARED = path.resolve(PROJECT_ROOT, "shared");

// --- mesma função fail-closed do server.js ---
async function loadRequiredGovernanceFile(label, filePath) {
  try {
    const content = (await fs.readFile(filePath, "utf-8")).trim();
    if (!content) throw new Error("file is empty");
    return content;
  } catch (err) {
    throw new Error(
      `[Governance] Failed to load required file "${label}" at ${filePath}: ${err.message}`,
    );
  }
}

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} · ${name}${detail ? " — " + detail : ""}`);
};

// Carrega governança (mesma ordem do server.js)
const governance = {
  runtimePrompt: await loadRequiredGovernanceFile("runtime-prompt", path.resolve(SHARED, "runtime-prompt.md")),
  productContract: await loadRequiredGovernanceFile("product-contract", path.resolve(SHARED, "runtime-product-contract.md")),
  incidentRules: await loadRequiredGovernanceFile("incident-rules", path.resolve(SHARED, "runtime-incident-rules.md")),
  constitution: await loadRequiredGovernanceFile("constitution", path.resolve(SHARED, "runtime-constitution.md")),
};

// basePrompt simulado a partir do manifesto real (corpo de nox.md), espelhando loadPersona.
const noxRaw = await fs.readFile(path.resolve(PROJECT_ROOT, "src", "content", "manifests", "nox.md"), "utf-8");
const fm = noxRaw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
const basePrompt = fm ? fm[2].trim() : noxRaw.trim();

// Composição idêntica ao server.js
const finalSystemPrompt = [
  basePrompt,
  governance.runtimePrompt,
  `# NØX PRODUCT CONTRACT\n${governance.productContract}`,
  `# NØX INCIDENT RULES\n${governance.incidentRules}`,
  `# NØX RUNTIME CONSTITUTION (STRICT — SUPREME AUTHORITY)\n${governance.constitution}`,
].join("\n\n---\n\n");

// 1. Presença
const M_PC = "# NØX PRODUCT CONTRACT";
const M_IR = "# NØX INCIDENT RULES";
const M_CO = "# NØX RUNTIME CONSTITUTION (STRICT — SUPREME AUTHORITY)";
for (const [label, marker] of [["product-contract", M_PC], ["incident-rules", M_IR], ["constitution", M_CO]]) {
  record(`presença: ${label}`, finalSystemPrompt.includes(marker));
}

// 2. Ordem — Constitution é o último bloco
const iPC = finalSystemPrompt.indexOf(M_PC);
const iIR = finalSystemPrompt.indexOf(M_IR);
const iCO = finalSystemPrompt.indexOf(M_CO);
record("ordem: Constitution por último", iCO > iIR && iIR > iPC && iCO === Math.max(iPC, iIR, iCO),
  `idx PC=${iPC} IR=${iIR} CO=${iCO}`);

// 3. Descontaminação
const CONTAMINANTS = [/phishing não é crime/i, /redistribuição de acesso/i, /roubando acesso/i];
for (const rx of CONTAMINANTS) {
  record(`descontaminação: ${rx.source}`, !rx.test(finalSystemPrompt));
}

// 4. Sem chat.ts nos arquivos promovidos
for (const f of ["runtime-constitution.md", "runtime-product-contract.md"]) {
  const txt = await fs.readFile(path.resolve(SHARED, f), "utf-8");
  record(`sem chat.ts: ${f}`, !/chat\.ts/.test(txt));
}

// 5. Fail-closed — arquivo vazio deve lançar
let threwOnEmpty = false;
const tmpEmpty = path.resolve(SHARED, ".__verify_empty__.md");
try {
  await fs.writeFile(tmpEmpty, "   \n  ");
  try {
    await loadRequiredGovernanceFile("empty-test", tmpEmpty);
  } catch {
    threwOnEmpty = true;
  }
} finally {
  await fs.rm(tmpEmpty, { force: true });
}
record("fail-closed: arquivo vazio lança", threwOnEmpty);

// 5b. Fail-closed — arquivo ausente deve lançar
let threwOnMissing = false;
try {
  await loadRequiredGovernanceFile("missing-test", path.resolve(SHARED, ".__does_not_exist__.md"));
} catch {
  threwOnMissing = true;
}
record("fail-closed: arquivo ausente lança", threwOnMissing);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checagens passaram.`);
if (failed.length) {
  console.error("FALHOU: " + failed.map((f) => f.name).join("; "));
  process.exit(1);
}
console.log("OK: governança íntegra e descontaminada.");
