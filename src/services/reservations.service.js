import { db } from "../repositories/db.repository.js";
import { sendReservationPendingEmail } from "./email.service.js";

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

  if (
    !tableNumber ||
    !date ||
    !timeFrom ||
    !timeTo ||
    !name ||
    !email ||
    !phone ||
    !peopleCount
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Minden mező kitöltése kötelező (asztal, dátum, mettől, meddig, név, telefon, létszám).",
    });
  }

  // Egyszerű email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen email cím formátum.",
    });
  }

  const tableNum = Number(tableNumber);
  const ppl = Number(peopleCount);

  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 6) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen asztalszám. 1 és 6 között választható.",
    });
  }

  if (!Number.isInteger(ppl) || ppl <= 0 || ppl > 12) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen létszám. 1 és 12 fő között foglalhatsz.",
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      message:
        "Érvénytelen dátum formátum. Használd: ÉÉÉÉ-HH-NN (pl. 2025-11-21).",
    });
  }

  if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen időpont formátum. Használd: ÓÓ:PP (pl. 18:30).",
    });
  }

  const [yearStr, monthStr, dayStr] = date.split("-");
  const [fromHourStr, fromMinStr] = timeFrom.split(":");
  const [toHourStr, toMinStr] = timeTo.split(":");

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const fromHour = Number(fromHourStr);
  const fromMin = Number(fromMinStr);
  const toHour = Number(toHourStr);
  const toMin = Number(toMinStr);

  const startDt = new Date(year, month - 1, day, fromHour, fromMin, 0, 0);
  const endDt = new Date(year, month - 1, day, toHour, toMin, 0, 0);

  const isValidStart =
    startDt.getFullYear() === year &&
    startDt.getMonth() === month - 1 &&
    startDt.getDate() === day &&
    startDt.getHours() === fromHour &&
    startDt.getMinutes() === fromMin;

  const isValidEnd =
    endDt.getFullYear() === year &&
    endDt.getMonth() === month - 1 &&
    endDt.getDate() === day &&
    endDt.getHours() === toHour &&
    endDt.getMinutes() === toMin;

  if (
    !isValidStart ||
    !isValidEnd ||
    isNaN(startDt.getTime()) ||
    isNaN(endDt.getTime())
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Érvénytelen dátum vagy időpont. Kérlek ellenőrizd a megadott értékeket.",
    });
  }

  if (endDt.getTime() <= startDt.getTime()) {
    return res.status(400).json({
      success: false,
      message: "A foglalás vége legyen később, mint a kezdete.",
    });
  }

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const reservationDay = new Date(year, month - 1, day);

  if (reservationDay < today) {
    return res.status(400).json({
      success: false,
      message:
        "Már elmúlt napra nem tudsz foglalni. Kérlek válassz egy későbbi dátumot.",
    });
  }

  const isToday =
    reservationDay.getFullYear() === today.getFullYear() &&
    reservationDay.getMonth() === today.getMonth() &&
    reservationDay.getDate() === today.getDate();

  if (isToday && startDt.getTime() <= now.getTime()) {
    return res.status(400).json({
      success: false,
      message:
        "Erre az időpontra már nem tudsz foglalni. Válassz későbbi időpontot a mai napra.",
    });
  }

  const mysqlStart = `${timeFrom}:00`;
  const mysqlEnd = `${timeTo}:00`;

  // új foglalás intervalluma percekben (napon belül)
  const newStartMinutes = fromHour * 60 + fromMin;
  const newEndMinutes = toHour * 60 + toMin;

  // Minimum foglalási idő: 1 óra
  if (newEndMinutes - newStartMinutes < 60) {
    return res.status(400).json({
      success: false,
      message: "A foglalás időtartama legalább 1 óra kell legyen.",
    });
  }

  // Hétvége vagy hétköznap?
  // 0 = vasárnap, 6 = szombat
  const dayOfWeek = reservationDay.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Idősáv limitek percben
  let minStartMinutes;
  let maxEndMinutes;

  if (isWeekend) {
    // hétvége: 12:00–23:00
    minStartMinutes = 12 * 60; // 720
    maxEndMinutes = 23 * 60; // 1380
  } else {
    // hétköznap: 11:00–22:00
    minStartMinutes = 11 * 60; // 660
    maxEndMinutes = 22 * 60; // 1320
  }

  if (newStartMinutes < minStartMinutes || newEndMinutes > maxEndMinutes) {
    return res.status(400).json({
      success: false,
      message: isWeekend
        ? "Hétvégén 12:00 és 23:00 között tudsz foglalni."
        : "Hétköznap 11:00 és 22:00 között tudsz foglalni.",
    });
  }

  const conflictSql = `
    SELECT id, reservation_date, reservation_time, end_time
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

    const hasOverlap = conflictRows.some((r) => {
      let timePartFrom = "";
      let timePartTo = "";

      // Kezdés (HH:MM)
      if (typeof r.reservation_time === "string") {
        timePartFrom = r.reservation_time.slice(0, 5);
      } else if (r.reservation_time instanceof Date) {
        timePartFrom = r.reservation_time.toTimeString().slice(0, 5);
      }

      // Vége (HH:MM)
      if (r.end_time) {
        if (typeof r.end_time === "string") {
          timePartTo = r.end_time.slice(0, 5);
        } else if (r.end_time instanceof Date) {
          timePartTo = r.end_time.toTimeString().slice(0, 5);
        }
      } else {
        // ha nincs eltárolt end_time, számoljunk 120 perces intervallummal
        if (!timePartFrom) return false;
        const [ehStr, emStr] = timePartFrom.split(":");
        const tmpStartMinutes = Number(ehStr) * 60 + Number(emStr);
        const tmpEndMinutes = tmpStartMinutes + 120;
        const tmpEndHour = Math.floor(tmpEndMinutes / 60);
        const tmpEndMin = tmpEndMinutes % 60;
        timePartTo = `${String(tmpEndHour).padStart(2, "0")}:${String(
          tmpEndMin
        ).padStart(2, "0")}`;
      }

      if (!timePartFrom || !timePartTo) return false;

      const [exFromH, exFromM] = timePartFrom.split(":").map(Number);
      const [exToH, exToM] = timePartTo.split(":").map(Number);

      const existingStartMinutes = exFromH * 60 + exFromM;
      const existingEndMinutes = exToH * 60 + exToM;

      // intervallum ütközés vizsgálat: ha egyik vége <= másik eleje, akkor nincs átfedés
      const noOverlap =
        existingEndMinutes <= newStartMinutes ||
        existingStartMinutes >= newEndMinutes;

      return !noOverlap;
    });

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

    const loggedInUserId = req.user ? req.user.id : null;

    db.query(
      insertSql,
      [
        tableNum,
        date,
        mysqlStart,
        mysqlEnd,
        name,
        email,
        phone,
        ppl,
        note || null,
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

        // 🔔 Foglalás rögzítve → küldjünk „függőben” emailt
        sendReservationPendingEmail({
          email,
          name,
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
      }
    );
  });
}
