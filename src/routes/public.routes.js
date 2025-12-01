import { Router } from "express";
import * as publicController from "../controllers/public.controller.js";

const router = Router();

router.get("/products", publicController.getProducts);
router.get("/menu", publicController.getMenu);

export default router;
