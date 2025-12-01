import * as accountService from "../services/account.service.js";

export const updateProfile = (req, res) => accountService.updateProfile(req, res);
export const changePassword = (req, res) => accountService.changePassword(req, res);
