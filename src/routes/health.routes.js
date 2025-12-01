import { Router } from "express";
import * as healthController from "../controllers/health.controller.js";

const router = Router();

router.get("/ping", healthController.ping);
router.get("/db-test", healthController.dbTest);

export default router;
