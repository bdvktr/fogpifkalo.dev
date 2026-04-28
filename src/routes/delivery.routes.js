import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller.js";
import { requireDelivery } from "../middleware/auth.middleware.js";

const router = Router();

// Minden itt lévő endpoint csak futárnak érhető el
router.use(requireDelivery);

// Rendelések listázása futárnak
router.get("/orders", deliveryController.getPendingOrders);

router.get("/orders/completed", deliveryController.getCompletedOrders);

// Rendelés részletei futárnak
router.get("/orders/:id", deliveryController.getOrderDetails);

// Rendelés teljesítése futár által
router.put("/orders/:id/complete", deliveryController.completeOrder);

// Visszavonás: completed -> pending
router.put("/orders/:id/undo", deliveryController.undoCompleteOrder);

export default router;
