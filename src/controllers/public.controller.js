import * as publicService from "../services/public.service.js";

export const getProducts = (req, res) => publicService.getProducts(req, res);
export const getMenu = (req, res) => publicService.getMenu(req, res);
export const getSpecialOffers = (req, res) => publicService.getSpecialOffers(req, res);
