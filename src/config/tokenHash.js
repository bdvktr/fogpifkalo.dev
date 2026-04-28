import crypto from "node:crypto";

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}
