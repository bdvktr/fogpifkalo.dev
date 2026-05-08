import * as reservationsService from "../services/reservations.service.js";

export const getReservationAvailability = (req, res) =>
  reservationsService.getReservationAvailability(req, res);

export const createReservation = (req, res) =>
  reservationsService.createReservation(req, res);
