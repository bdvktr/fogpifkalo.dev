import * as deliveryService from "../services/delivery.service.js";

export const getPendingOrders = (req, res) => deliveryService.getPendingOrders(req, res);
export const completeOrder = (req, res) => deliveryService.completeOrder(req, res);
export const getOrderDetails = (req, res) => deliveryService.getOrderDetails(req, res);
export const getCompletedOrders = (req, res) => deliveryService.getCompletedOrders(req, res);
export const undoCompleteOrder = (req, res) => deliveryService.undoCompleteOrder(req, res);

