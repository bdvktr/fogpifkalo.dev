import { Router } from "express";
import { requireLogin } from "../middleware/auth.middleware.js";
import * as reservationsController from "../controllers/reservations.controller.js";

const router = Router();

router.post("/reservations", requireLogin, reservationsController.createReservation);

export default router;
