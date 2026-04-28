import { io } from "../server.js";

// Ha változik a pending rendelés lista (futár app)
export function emitPendingOrdersUpdated() {
  if (!io) {
    console.warn("Socket.IO instance nem elérhető (io).");
    return;
  }
  io.emit("pendingOrdersUpdated");
}

// Ha változik a foglalás lista (admin mobil / admin web)
export function emitReservationsUpdated() {
  if (!io) {
    console.warn("Socket.IO instance nem elérhető (io).");
    return;
  }
  io.emit("reservationsUpdated");
}
