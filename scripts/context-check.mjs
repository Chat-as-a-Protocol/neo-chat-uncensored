import fs from "fs";
import path from "path";

const FILES_TO_CHECK = [
  "neo-ai/README.md",
  "neo-ai/CONTEXT.md",
  "neo-ai/CONSTRAINTS.md",
  "neo-ai/WORKSPACE.md",
  "ARCHITECTURE.md",
  "STYLE.md",
];

let hasErrors = false;

console.log("🔍 Iniciando Context Lint...");

// 1. Check for remaining placeholders {{...}}
FILES_TO_CHECK.forEach((file) => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const placeholders = content.match(/\{\{[A-Z0-9_]+\}\}/g);

    if (placeholders) {
      console.warn(
        `⚠️  [${file}]: Contém placeholders não preenchidos: ${[...new Set(placeholders)].join(", ")}`,
      );
      // Não marca como erro no template, apenas avisa.
      // Em produção, você pode mudar para hasErrors = true;
    }
  }
});

// 2. Sync check with package.json (se existir)
const pkgPath = path.resolve(process.cwd(), "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const contextPath = path.resolve(process.cwd(), "neo-ai/CONTEXT.md");

  if (fs.existsSync(contextPath)) {
    const context = fs.readFileSync(contextPath, "utf-8");

    // Check version
    if (pkg.version && !context.includes(pkg.version)) {
      console.error(
        `❌ [CONTEXT.md]: Versão do projeto (${pkg.version}) não encontrada no contexto.`,
      );
      hasErrors = true;
    }

    // Check runtime (engines.node)
    if (pkg.engines?.node) {
      const constraintsPath = path.resolve(
        process.cwd(),
        "neo-ai/CONSTRAINTS.md",
      );
      if (fs.existsSync(constraintsPath)) {
        const constraints = fs.readFileSync(constraintsPath, "utf-8");
        if (!constraints.includes(pkg.engines.node)) {
          console.error(
            `❌ [CONSTRAINTS.md]: Runtime Node (${pkg.engines.node}) não condiz com as regras imutáveis.`,
          );
          hasErrors = true;
        }
      }
    }
  }
} else {
  console.log(
    "ℹ️  package.json não encontrado. Pulando validação de sincronia de versão.",
  );
}

if (hasErrors) {
  console.log("\n❌ Context Lint falhou. Corrija os arquivos de contexto.");
  process.exit(1);
} else {
  console.log("\n✅ Context Lint concluído com sucesso!");
  process.exit(0);
}
