import * as adminService from "../services/admin.service.js";

export const getProducts = (req, res) => adminService.getProducts(req, res);
export const createProduct = (req, res) => adminService.createProduct(req, res);
export const updateProduct = (req, res) => adminService.updateProduct(req, res);
export const softDeleteProduct = (req, res) => adminService.softDeleteProduct(req, res);
export const activateProduct = (req, res) => adminService.activateProduct(req, res);

export const getOrders = (req, res) => adminService.getOrders(req, res);
export const getOrderDetails = (req, res) => adminService.getOrderDetails(req, res);
export const updateOrderStatus = (req, res) => adminService.updateOrderStatus(req, res);

export const getReservations = (req, res) => adminService.getReservations(req, res);
export const updateReservationStatus = (req, res) => adminService.updateReservationStatus(req, res);

export const uploadProductImage = (req, res) => adminService.uploadProductImage(req, res);
