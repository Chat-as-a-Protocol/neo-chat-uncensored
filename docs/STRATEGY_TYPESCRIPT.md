# Estratégia de Tipagem NΞØ (Protocolo "No-Any")

Para manter a integridade e a segurança do ecossistema NΞØ Protocol, estabelecemos o padrão **Strict Sovereignty** para o código TypeScript/Astro. O uso de `any` é considerado uma falha de soberania sobre o dado.

## 1. Regras de Ouro

1. **Zero Implicit Any**: Toda variável global, parâmetro de função e retorno de API deve ser explicitamente tipado.
2. **Interfaces sobre Objetos**: Nunca use `{}` ou `object` para representar opções. Defina uma `interface` clara para cada conjunto de parâmetros.
3. **Null-Safety como Padrão**: Elementos do DOM e respostas de API devem ser tratados como `| null` ou `| undefined`, utilizando checks de existência (`if`) ou optional chaining (`?.`).
4. **JSDoc para JS legado**: Em arquivos onde a migração completa para `.ts` não for possível, utilize JSDoc para definir os tipos.

## 2. Implementação em Componentes Astro

Astro processa tags `<script>` como TypeScript por padrão. Para implementar a estratégia:

```typescript
// 1. Defina interfaces no topo do script
interface MessageOptions {
  streaming?: boolean;
  id?: string;
}

// 2. Tipagem de estado global do script
let streamingBubble: HTMLElement | null = null;

// 3. Tipagem de funções
function append(content: string, opts: MessageOptions = {}) {
  // ...
}
```

## 3. Gestão de DOM

Sempre realize o cast ou verificação de instância para garantir que os métodos específicos do elemento estejam disponíveis e seguros:

```typescript
const input = document.getElementById('chat-input');
if (input instanceof HTMLTextAreaElement) {
  input.value = ""; // Seguro
}
```

## 4. Auditoria Contínua

O comando `make lint` (ou `pnpm astro check`) deve ser executado antes de cada commit. Falhas de tipagem bloqueiam o deploy em ambiente de produção (Railway).
