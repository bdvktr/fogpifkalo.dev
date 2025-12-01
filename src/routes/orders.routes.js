import { Router } from "express";
import * as ordersController from "../controllers/orders.controller.js";
import { requireLogin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/checkout", requireLogin, ordersController.checkout);
router.get("/orders", requireLogin, ordersController.getMyOrders);

export default router;
