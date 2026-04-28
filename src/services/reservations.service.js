import { db } from "../repositories/db.repository.js";
import { sendReservationPendingEmail } from "./email.service.js";
import {
  hasReservationOverlap,
  normalizeOptionalText,
  normalizeRequiredText,
  validateReservationInput,
} from "./reservation-validation.service.js";

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
