import { Router } from "express";
import * as myResController from "../controllers/my-reservations.controller.js";
import { requireLogin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/my/reservations", requireLogin, myResController.getMyReservations);
router.put("/my/reservations/:id/cancel", requireLogin, myResController.cancelMyReservation);
router.put("/my/reservations/:id", requireLogin, myResController.updateMyReservationDetails);
router.put("/my/reservations/:id/time", requireLogin, myResController.updateMyReservationTime);

export default router;
