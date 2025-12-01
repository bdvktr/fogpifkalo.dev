import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { requireLogin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/cart", requireLogin, cartController.getCart);
router.post("/cart/add", requireLogin, cartController.addToCart);
router.post("/cart/clear", requireLogin, cartController.clearCart);
router.post("/cart/remove", requireLogin, cartController.removeItem);

export default router;
