export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatAnnouncementContent = (content = "") => {
  const escaped = escapeHtml(content);

  return escaped
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
};

export const formatBrl = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
};
