import * as authService from "../services/auth.service.js";

export const register = (req, res) => authService.register(req, res);
export const login = (req, res) => authService.login(req, res);
export const refresh = (req, res) => authService.refresh(req, res);
export const me = (req, res) => authService.me(req, res);
export const adminSelf = (req, res) => authService.adminSelf(req, res);
export const logout = (req, res) => authService.logout(req, res);
