import * as cartService from "../services/cart.service.js";

export const getCart = (req, res) => cartService.getCart(req, res);
export const addToCart = (req, res) => cartService.addToCart(req, res);
export const clearCart = (req, res) => cartService.clearCart(req, res);
export const removeItem = (req, res) => cartService.removeItem(req, res);
