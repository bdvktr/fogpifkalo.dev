import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { authWithRefreshMiddleware, requireAdminOrErrorPage, adminRefreshMiddleware} from "./middleware/auth.middleware.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import publicRoutes from "./routes/public.routes.js";
import reservationRoutes from "./routes/reservations.routes.js";
import myReservationsRoutes from "./routes/my-reservations.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const rootDir = path.join(__dirname, "..");

app.use(express.static(path.join(rootDir, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authWithRefreshMiddleware);

// Admin HTML oldal levédve
app.get("/admin", adminRefreshMiddleware, requireAdminOrErrorPage, (req, res) => {
  res.sendFile(path.join(rootDir, "protected/admin.html"));
});

// API-k
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", accountRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", publicRoutes);
app.use("/api", reservationRoutes);
app.use("/api", myReservationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery", deliveryRoutes);

// 404 API fallback
app.use("/api", (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: "API endpoint nem található.",
  });
});

//404 Nem API fallback
app.use((req, res) => {
  res
    .status(404)
    .sendFile(path.join(__dirname, "../public/error404.html"));
});

export default app;
