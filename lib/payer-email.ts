// Paystack needs an email address to start a payment. When the customer didn't give one,
// use a placeholder on the shop's own domain. It is only sent to Paystack and is never saved on the order.
export function payerEmail(email: string, phone: string, host: string | null) {
  if (email) return email;
  const h = (host ?? "").split(":")[0].toLowerCase();
  const domain = !h || h === "localhost" || h.endsWith(".vercel.app") ? "reinitasapparel.com" : h.replace(/^www\./, "");
  return `${phone.replace(/\D/g, "")}@noemail.${domain}`;
}
