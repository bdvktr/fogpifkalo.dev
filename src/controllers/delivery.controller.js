import * as deliveryService from "../services/delivery.service.js";

export const getPendingOrders = (req, res) => deliveryService.getPendingOrders(req, res);
export const completeOrder = (req, res) => deliveryService.completeOrder(req, res);
export const getOrderDetails = (req, res) => deliveryService.getOrderDetails(req, res);
