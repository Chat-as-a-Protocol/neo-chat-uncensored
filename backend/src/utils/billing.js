/**
 * Conta o número de tokens em um texto com base na regra de caracteres.
 * @param {string} text 
 * @returns {number}
 */
export function countTokensFromText(text) {
  if (!text) return 0;
  // Regra simples: 1 token ~= 4 caracteres em português
  return Math.ceil(text.length / 4);
}
