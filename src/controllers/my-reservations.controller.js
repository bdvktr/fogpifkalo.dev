import * as myResService from "../services/my-reservations.service.js";

export const getMyReservations = (req, res) =>
  myResService.getMyReservations(req, res);

export const cancelMyReservation = (req, res) =>
  myResService.cancelMyReservation(req, res);

export const updateMyReservationDetails = (req, res) =>
  myResService.updateMyReservationDetails(req, res);

export const updateMyReservationTime = (req, res) =>
  myResService.updateMyReservationTime(req, res);
