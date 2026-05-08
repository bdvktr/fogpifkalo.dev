import { db } from "../repositories/db.repository.js";
import { sendReservationPendingEmail } from "./email.service.js";
import { emitReservationsUpdated } from "../config/websocket.js";
import {
  hasReservationOverlap,
  normalizeOptionalText,
  normalizeRequiredText,
  validateReservationInput,
} from "./reservation-validation.service.js";

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeTimeValue(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value.slice(0, 5);
  }

  if (value instanceof Date) {
    return value.toTimeString().slice(0, 5);
  }

  return null;
}

function addTwoHours(timeValue) {
  const time = normalizeTimeValue(timeValue);
  if (!time) return null;

  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  const totalMinutes = hour * 60 + minute + 120;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;

  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export function getReservationAvailability(req, res) {
  const date = typeof req.query?.date === "string" ? req.query.date.trim() : "";

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "A dátum megadása kötelező.",
    });
  }

  if (!isValidDateString(date)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen dátum formátum. Használd: ÉÉÉÉ-HH-NN.",
    });
  }

  const sql = `
    SELECT
      id,
      table_number,
      reservation_date,
      reservation_time,
      end_time,
      status
    FROM reservations
    WHERE reservation_date = ?
      AND status IN ('pending', 'confirmed')
    ORDER BY table_number ASC, reservation_time ASC, id ASC
  `;

  db.query(sql, [date], (err, rows) => {
    if (err) {
      console.error("DB hiba (reservation availability):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba az elérhetőségek lekérésekor.",
      });
    }

    const reservations = (rows || []).map((row) => ({
      id: row.id,
      tableNumber: Number(row.table_number),
      date: row.reservation_date,
      timeFrom: normalizeTimeValue(row.reservation_time),
      timeTo: normalizeTimeValue(row.end_time) || addTwoHours(row.reservation_time),
      status: row.status,
    }));

    return res.json({
      success: true,
      date,
      reservations,
    });
  });
}

export function createReservation(req, res) {
  const {
    tableNumber,
    date,
    timeFrom,
    timeTo,
    name,
    email,
    phone,
    peopleCount,
    note,
  } = req.body || {};

  const normalizedName = normalizeRequiredText(name);
  const normalizedEmail = normalizeRequiredText(email).toLowerCase();
  const normalizedPhone = normalizeRequiredText(phone);
  const normalizedNote = normalizeOptionalText(note);

  if (
    !tableNumber ||
    !date ||
    !timeFrom ||
    !timeTo ||
    !normalizedName ||
    !normalizedEmail ||
    !normalizedPhone ||
    !peopleCount
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Minden mező kitöltése kötelező (asztal, dátum, mettől, meddig, név, telefon, létszám).",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen email cím formátum.",
    });
  }

  const validation = validateReservationInput({
    tableNumber,
    date,
    timeFrom,
    timeTo,
    peopleCount,
  });

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const {
    tableNum,
    ppl,
    mysqlStart,
    mysqlEnd,
    newStartMinutes,
    newEndMinutes,
  } = validation;

  const conflictSql = `
    SELECT id, reservation_time, end_time
    FROM reservations
    WHERE table_number = ?
      AND reservation_date = ?
      AND status IN ('pending', 'confirmed')
  `;

  db.query(conflictSql, [tableNum, date], (conflictErr, conflictRows) => {
    if (conflictErr) {
      console.error("DB hiba (reservation conflict check):", conflictErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a foglalás ellenőrzésekor.",
      });
    }

    const hasOverlap = hasReservationOverlap(
      conflictRows,
      newStartMinutes,
      newEndMinutes,
    );

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message:
          "Erre az idősávra ezen az asztalon már van foglalás. Kérlek válassz másik időpontot vagy asztalt.",
      });
    }

    const insertSql = `
      INSERT INTO reservations
        (table_number, reservation_date, reservation_time, end_time, name, email, phone, people_count, note, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const loggedInUserId = Number(req.user?.id);

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Asztalfoglaláshoz be kell jelentkezned.",
      });
    }

    db.query(
      insertSql,
      [
        tableNum,
        date,
        mysqlStart,
        mysqlEnd,
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        ppl,
        normalizedNote,
        loggedInUserId,
      ],
      (err2, result) => {
        if (err2) {
          console.error("DB hiba (reservation insert):", err2);
          return res.status(500).json({
            success: false,
            message: "Szerver hiba a foglalás mentésekor.",
          });
        }

        emitReservationsUpdated();

        sendReservationPendingEmail({
          email: normalizedEmail,
          name: normalizedName,
          date,
          timeFrom,
          timeTo,
          tableNumber: tableNum,
          peopleCount: ppl,
        }).catch((emailErr) => {
          console.error("Hiba a pending foglalás email küldésekor:", emailErr);
        });

        return res.json({
          success: true,
          message:
            "Foglalásod rögzítettük, hamarosan visszaigazoljuk. Köszönjük!",
          reservationId: result.insertId,
        });
      },
    );
  });
}
