import * as auditService from "../services/audit.service.js";

export const getAdminLogs = (req, res) =>
  auditService.getAdminLogs(req, res);
