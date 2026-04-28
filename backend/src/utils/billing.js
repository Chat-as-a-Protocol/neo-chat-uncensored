/**
 * Estima o número de tokens em um chunk de stream SSE da Venice.
 * No MVP, usamos uma heurística baseada na presença de 'content'.
 * @param {string} chunk 
 * @returns {number}
 */
export function estimateTokensFromChunk(chunk) {
  if (!chunk) return 0;
  return chunk
    .split("\n")
    .filter((l) => l.includes('"content"'))
    .length;
}

/**
 * Calcula o custo estimado de uma mensagem com base no tamanho do texto.
 * @param {string} text 
 * @returns {number}
 */
export function estimateTokensFromText(text) {
  if (!text) return 0;
  // Heurística padrão: 1 token ~= 4 caracteres em inglês, ou 3 em PT
  return Math.ceil(text.length / 3);
}
