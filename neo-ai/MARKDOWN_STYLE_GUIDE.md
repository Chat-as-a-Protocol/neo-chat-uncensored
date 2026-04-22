<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · MARKDOWN STYLE GUIDE

> Fonte canônica de estilo para documentação do projeto.
> Todo arquivo Markdown deve seguir este sistema de organização
> visual e semântica.

```text
========================================
    ORGANIZATION · MARKDOWN STYLE
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

## ⟠ Objetivo

Garantir que todo arquivo Markdown siga o mesmo sistema de escrita,
composição visual e organização semântica.

Não improvise estilo.
Não transforme documentação em texto genérico.
Não escreva como blog, release de marketing ou tutorial raso.

────────────────────────────────────────

## ⨷ Regras de Formatação

### 1. Cabeçalho Inicial

Quando o documento for principal, estrutural ou indexador, comece com:

```md
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```

Na sequência, abra com um bloco `text` usando banner
visual com título centralizado:

```text
========================================
         PROJECT NAME · SECTION
========================================
```

### 2. Separadores Visuais

Entre blocos principais, use sempre esta linha isolada:

```text
────────────────────────────────────────
```

Ela funciona como divisor de ritmo entre seções centrais.
Não empilhe divisores sem necessidade.

### 3. Símbolos, Bullet Points e Títulos

Use títulos Markdown de nível 2 com um símbolo
geométrico puro (Unicode) e nome curto.
**Nunca utilize emojis sistêmicos coloridos (🚫🍎🔥).**

Padrão de cabeçalho:

```md
## ⟠ Objetivo

## ⨷ Contrato

## ⧉ Estrutura

## ⍟ Segurança

## ◬ Documentação
```

Utilize símbolos para criar âncoras na leitura (bullets e títulos).
Catálogo prioritário de símbolos limpos e estruturais
(geometrias, glifos lógicos, blocos):
`⟁` `⟠` `⧉` `⧇` `⧖` `⧗` `⍟` `◬` `◭` `◮` `◯` `⨀` `⨂`
`⨷` `◱` `◲` `◳` `◴` `◵` `◶` `◷` `⦿` `ꙮ` `◸` `◹` `◺`

Regras:

- o título deve ser curto
- abolir emojis nativos do OS, substituindo por tipografia crua
- o símbolo deve criar hierarquia dura e âncora visual para humanos
- evite títulos longos, abstratos ou literários

### 4. Blocos Textuais Estruturados

Sempre que houver arquitetura, árvore de diretórios, mapa
de capacidades, tabela resumida, comandos, inventário,
status, contagem ou matriz operacional, prefira bloco
cercado por crases com linguagem `text`.

Exemplos aceitos:

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ITEM                  VALOR
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Network               Base
┃ Contract              IgnitionToken
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```text
project/
├── src/
├── docs/
└── scripts/
```

```text
▓▓▓ SECTION NAME
────────────────────────────────────────
└─ ITEM 1
└─ ITEM 2
```

### 5. Parágrafos e Comprimento de Linha (Hard Wrap)

O texto deve ser curto, direto e quebrado em linhas pequenas
ao término de cada ideia lógica (Semantic Linebreaks).
Limite a largura da linha em **80 caracteres** no máximo.

Padrão esperado:

- frases objetivas e curtas
- máximo de 80 caracteres (hard wrap)
- uma ideia ou cláusula por linha
- sem parágrafos fluidos longos
- sem enchimento retórico

Prefira:

```md
Operational contract for autonomous deploy.

Defines required inputs,
expected outputs and
failure behavior.
```

Evite:

- blocos longos de explicação
- introduções genéricas
- texto ornamental
- linguagem institucional vazia

### 6. Metadados

Quando o documento precisar de metadados rápidos, use bloco de citação:

```md
> **Version:** v1.0.0  
> **Status:** active  
> **Node:** ≥22.0.0
```

Use isso para versão, status, runtime, escopo ou licença.

### 7. Listas e Links

Use listas curtas e funcionais.
Links devem aparecer como navegação operacional,
não como excesso de referência.

Exemplo:

```md
**Começar aqui:**

- [SETUP](./SETUP.md)
- [DEPLOY](./DEPLOY.md)
```

### 8. Comandos

Comandos devem aparecer em bloco `bash` e com comentário mínimo.

Exemplo:

```bash
npm install
npm run compile
npm run deploy -- --network base
```

Se houver sequência operacional, agrupe por objetivo.
Não misture comandos aleatórios no mesmo bloco.

### 9. Estilo ASCII e Composição Terminal

A identidade visual da documentação preza por uma estética
"terminal / cyberpunk" através do uso contido e preciso de
caracteres Unicode (Block Elements e Box Drawing).

Regras de aplicação:

- **Títulos/Divisores**: Use linhas (`──────────────++++──────────────`)
  e texturas (`▓▓▓`) para quebrar fluxo e indicar atenção.
- **Hierarquia**: Use conectivos limpos (`┏`, `┣`, `┗`, `└─`, `├──`).
- **Lettering (ASCII Type)**: Só para painéis de topo ou letreiros
  do protocolo. Deve ser legível e caber em 80 colunas.
- **Proibido**: Arte figurativa. A estética é geométrica e esquemática.

────────────────────────────────────────

## ⧉ Estrutura Semântica Recomendada

Quando aplicável, organize o documento nesta ordem:

1. objetivo
2. contexto
3. contrato ou comportamento esperado
4. entradas obrigatórias
5. fluxo de execução
6. saídas e artefatos
7. erros e falhas explícitas
8. exemplos
9. referências relacionadas

Não use seções vazias.
Use apenas o que for necessário.

## ⍟ Fechamento

Quando o documento for principal, manifesto, índice ou diretriz,
finalize com assinatura visual explícita em bloco `text`.

Exemplo:

```text
▓▓▓ ORGANIZATION NAME
────────────────────────────────────────
Role or system identity
────────────────────────────────────────
```

────────────────────────────────────────

## ◬ Estilo Obrigatório de Escrita

Todo `.md` deve ser:

- técnico
- modular
- escaneável
- visualmente estruturado
- semanticamente explícito
- fiel ao hard wrap (limitado em colunas)
- sem gordura verbal

O texto deve:

- priorizar contratos, fluxos, garantias e limites
- declarar obrigatoriedade com precisão
- transformar ambiguidade em regra
- tratar documentação como interface operacional

### Proibições

Não fazer:

- texto fluído com cara de blog
- introdução genérica que não informa nada
- parágrafo longo para esconder falta de estrutura
- seção ornamental sem função
- inventar formato novo em cada documento
- usar tabela Markdown onde bloco `text` seja mais claro

### Regra

Todos os arquivos `.md` devem pertencer ao mesmo sistema editorial.

Na dúvida entre estilo livre ou rigor padronizado,
escolha a geometria e a consistência técnica.

### Assinatura padrão

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
