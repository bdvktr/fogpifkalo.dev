import { io } from "../server.js";

// Ezt hívjuk meg, ha változik a pending rendelés lista
export function emitPendingOrdersUpdated() {
  if (!io) {
    console.warn("Socket.IO instance nem elérhető (io).");
    return;
  }

  // minden kapcsolódott kliensnek küldjük
  io.emit("pendingOrdersUpdated");
}
