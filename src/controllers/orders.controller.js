import * as ordersService from "../services/orders.service.js";

export const checkout = (req, res) => ordersService.checkout(req, res);
export const getMyOrders = (req, res) => ordersService.getMyOrders(req, res);
