export const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const assertEmail = (email) => {
  if (!isValidEmail(email)) {
    throw new Error("[Email] Destinatário inválido ou ausente");
  }
};
