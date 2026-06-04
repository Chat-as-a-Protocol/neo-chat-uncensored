import { getEncoding } from "js-tiktoken";

// Inicializamos o encoder cl100k_base
const enc = getEncoding("cl100k_base");

/**
 * Conta o número real de tokens em um texto usando o algoritmo Tiktoken.
 * @param {string} text Texto para contar tokens
 * @returns {number} Quantidade de tokens
 */
export const countTokensFromText = (text) => {
  if (!text || typeof text !== "string") return 0;
  try {
    return enc.encode(text).length;
  } catch (err) {
    console.error("[Billing] Erro ao codificar tokens:", err);
    // Fallback conservador se falhar (1 token a cada 3 caracteres)
    return Math.ceil(text.length / 3);
  }
};
/**
 * Estima o número de tokens em uma lista de mensagens, incluindo overhead de estrutura.
 * @param {Array} messages Lista de mensagens [{role, content}]
 * @returns {number} Estimativa total de tokens
 */
export const countTokensFromMessages = (messages) => {
  if (!Array.isArray(messages)) return 0;
  let tokens = 0;

  for (const msg of messages) {
    tokens += countTokensFromText(msg.content || "");
    tokens += 6; // Overhead médio por mensagem (role + estrutura JSON)
  }

  return tokens + 10; // Overhead final do chat
};
