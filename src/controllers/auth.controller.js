import * as authService from "../services/auth.service.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

export const register = (req, res) => authService.register(req, res);
export const login = (req, res) => authService.login(req, res);
export const me = (req, res) => authService.me(req, res);
export const adminSelf = (req, res) => authService.adminSelf(req, res);
export const logout = (req, res) => authService.logout(req, res);
