import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.get("/me", authController.me);
router.get("/me/admin", requireAdmin, authController.adminSelf);
router.post("/logout", authController.logout);

export default router;
