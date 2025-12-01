import { Router } from "express";
import * as reservationsController from "../controllers/reservations.controller.js";

const router = Router();

router.post("/reservations", reservationsController.createReservation);

export default router;
