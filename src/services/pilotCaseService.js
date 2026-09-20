import crypto from "node:crypto";

export function generateCaseId() {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now).replace(/-/g, "");

  const nonce = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PX-${ymd}-${nonce}`;
}
