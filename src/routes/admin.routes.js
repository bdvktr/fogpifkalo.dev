import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import { handleProductImageUpload } from "../middleware/multer.middleware.js";
import * as auditController from "../controllers/audit.controller.js";


const router = Router();

router.use(requireAdmin);

router.get("/products", adminController.getProducts);
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.softDeleteProduct);
router.put("/products/:id/activate", adminController.activateProduct);

router.get("/orders", adminController.getOrders);
router.get("/orders/:id", adminController.getOrderDetails);
router.put("/orders/:id/status", adminController.updateOrderStatus);

router.get("/reservations", adminController.getReservations);
router.put("/reservations/:id/status", adminController.updateReservationStatus);

router.post("/products/upload-image", handleProductImageUpload, adminController.uploadProductImage);

//csak olvasható
router.get("/logs", auditController.getAdminLogs);


export default router;
