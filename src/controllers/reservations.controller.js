import * as reservationsService from "../services/reservations.service.js";

export const createReservation = (req, res) =>
  reservationsService.createReservation(req, res);
