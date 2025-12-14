import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Express app → HTTP szerver
const server = http.createServer(app);

// Socket.IO szerver
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // ha akarod, később szűkíthető
  },
});

// kapcsolat esemény
io.on("connection", (socket) => {
  console.log("Futár app csatlakozott websocketen:", socket.id);

  socket.on("disconnect", () => {
    console.log("Futár app lecsatlakozott:", socket.id);
  });
});

// Exportáljuk más moduloknak (service-ek fogják használni)
export { io };

// Indítjuk a szervert
server.listen(PORT, "0.0.0.0", () => {
  console.log(`BurgerBázis backend fut: http://localhost:${PORT}`);
});
