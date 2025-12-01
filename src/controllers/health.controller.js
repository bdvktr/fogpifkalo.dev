import * as healthService from "../services/health.service.js";

export const ping = (req, res) => healthService.ping(req, res);
export const dbTest = (req, res) => healthService.dbTest(req, res);
