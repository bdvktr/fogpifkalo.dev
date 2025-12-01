import { Router } from "express";
import * as accountController from "../controllers/account.controller.js";
import { requireLogin } from "../middleware/auth.middleware.js";

const router = Router();

router.put("/account", requireLogin, accountController.updateProfile);
router.put("/account/password", requireLogin, accountController.changePassword);

export default router;
