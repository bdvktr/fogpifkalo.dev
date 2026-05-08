import { db } from "../repositories/db.repository.js";
import { emitReservationsUpdated } from "../config/websocket.js";
import {
  sendReservationUserUpdatedEmail,
  sendReservationUserCancelledEmail,
} from "./email.service.js";
import {
  hasReservationOverlap,
  normalizeOptionalText,
  validatePeopleCount,
  validateReservationInput,
} from "./reservation-validation.service.js";

export function getMyReservations(req, res) {
  const userId = req.user.id;

  const sql = `
    SELECT 
      id,
      table_number      AS tableNumber,
      reservation_date  AS date,
      reservation_time  AS timeFrom,
      end_time          AS timeTo,
      people_count      AS peopleCount,
      status,
      note,
      created_at        AS createdAt
    FROM reservations
    WHERE user_id = ?
    ORDER BY reservation_date DESC, reservation_time DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/my/reservations):", err);
      return res.status(500).json({
        success: false,
        message: "Hiba történt a foglalások lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      reservations: rows,
    });
  });
}

export function cancelMyReservation(req, res) {
  const userId = req.user.id;
  const reservationId = req.params.id;

  const sql = `
    UPDATE reservations
    SET status = 'cancelled'
    WHERE id = ? 
      AND user_id = ? 
      AND status != 'cancelled'
  `;

  db.query(sql, [reservationId, userId], (err, result) => {
    if (err) {
      console.error("DB hiba (/api/my/reservations/:id/cancel):", err);
      return res
        .status(500)
        .json({ success: false, message: "Hiba történt a lemondás közben." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Nem található ilyen foglalás, vagy már le lett mondva.",
      });
    }

    emitReservationsUpdated();

    // 💌 válasz a usernek
    res.json({
      success: true,
      message: "Foglalásodat sikeresen lemondtad.",
    });

    // 💌 email elküldése a usernek (fire-and-forget)
    const selectSql = `
        SELECT
          id,
          name,
          email,
          reservation_date,
          reservation_time,
          end_time,
          table_number,
          people_count
        FROM reservations
        WHERE id = ? AND user_id = ?
      `;

    db.query(selectSql, [reservationId, userId], (err2, rows) => {
      if (err2) {
        console.error(
          "DB hiba (user lemondás emailhez foglalás lekérdezése):",
          err2,
        );
        return;
      }

      if (!rows || rows.length === 0) {
        console.warn(
          "Foglalás nem található user lemondás emailhez, id:",
          reservationId,
        );
        return;
      }

      const r = rows[0];

      const reservationForMail = {
        email: r.email,
        name: r.name,
        date: r.reservation_date,
        timeFrom: r.reservation_time,
        timeTo: r.end_time,
        tableNumber: r.table_number,
        peopleCount: r.people_count,
      };

      sendReservationUserCancelledEmail(reservationForMail).catch(
        (emailErr) => {
          console.error(
            "Hiba a user lemondás email küldésekor (cancelMyReservation):",
            emailErr,
          );
        },
      );
    });
  });
}

export function updateMyReservationDetails(req, res) {
  const userId = req.user.id;
  const reservationId = req.params.id;
  const { peopleCount, note } = req.body;

  const peopleValidation = validatePeopleCount(peopleCount);
  if (!peopleValidation.success) {
    return res.status(400).json({
      success: false,
      message: peopleValidation.message,
    });
  }

  const normalizedNote = normalizeOptionalText(note);

  const sql = `
    UPDATE reservations
    SET
      people_count = ?,
      note = ?,
      status = CASE
        WHEN status = 'confirmed' THEN 'pending'
        ELSE status
      END
    WHERE id = ? AND user_id = ? AND status != 'cancelled'
  `;

  db.query(
    sql,
    [peopleValidation.ppl, normalizedNote, reservationId, userId],
    (err, result) => {
      if (err) {
        console.error("DB hiba (/api/my/reservations/:id):", err);
        return res.status(500).json({
          success: false,
          message: "Hiba történt a módosítás közben.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Nem található ilyen foglalás, vagy nem módosítható.",
        });
      }

      emitReservationsUpdated();

      res.json({
        success: true,
        message: "Foglalásod létszámát sikeresen módosítottad.",
      });

      const selectSql = `
        SELECT
          id,
          name,
          email,
          reservation_date,
          reservation_time,
          end_time,
          table_number,
          people_count
        FROM reservations
        WHERE id = ? AND user_id = ?
      `;

      db.query(selectSql, [reservationId, userId], (err2, rows) => {
        if (err2) {
          console.error(
            "DB hiba (foglalás emailhez lekérdezés user details update):",
            err2,
          );
          return;
        }

        if (!rows || rows.length === 0) {
          console.warn(
            "Foglalás nem található email küldéshez (details), id:",
            reservationId,
          );
          return;
        }

        const r = rows[0];

        const reservationForMail = {
          email: r.email,
          name: r.name,
          date: r.reservation_date,
          timeFrom: r.reservation_time,
          timeTo: r.end_time,
          tableNumber: r.table_number,
          peopleCount: r.people_count,
        };

        sendReservationUserUpdatedEmail(reservationForMail).catch(
          (emailErr) => {
            console.error(
              "Hiba a foglalás módosítva email küldésekor (details):",
              emailErr,
            );
          },
        );
      });
    },
  );
}

export function updateMyReservationTime(req, res) {
  const userId = req.user.id;
  const reservationId = req.params.id;

  const { date, timeFrom, timeTo, tableNumber } = req.body;

  const validation = validateReservationInput({
    tableNumber,
    date,
    timeFrom,
    timeTo,
    requirePeopleCount: false,
  });

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const { tableNum, mysqlStart, mysqlEnd, newStartMinutes, newEndMinutes } =
    validation;

  const getReservationSql = `
    SELECT id, status
    FROM reservations
    WHERE id = ? AND user_id = ?
  `;

  db.query(getReservationSql, [reservationId, userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (saját foglalás ellenőrzés):", err);
      return res.status(500).json({
        success: false,
        message: "Hiba történt a foglalás ellenőrzésekor.",
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nem található ilyen foglalás.",
      });
    }

    const reservation = rows[0];

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Lemondott foglalást nem lehet módosítani.",
      });
    }

    const overlapSql = `
      SELECT
        id,
        reservation_time,
        end_time
      FROM reservations
      WHERE table_number = ?
        AND reservation_date = ?
        AND status != 'cancelled'
        AND id <> ?
    `;

    db.query(overlapSql, [tableNum, date, reservationId], (err2, conflicts) => {
      if (err2) {
        console.error("DB hiba (ütközésellenőrzés módosításkor):", err2);
        return res.status(500).json({
          success: false,
          message: "Hiba történt az ütközések ellenőrzésekor.",
        });
      }

      const overlap = hasReservationOverlap(
        conflicts || [],
        newStartMinutes,
        newEndMinutes,
      );

      if (overlap) {
        return res.status(400).json({
          success: false,
          message:
            "Ezen az asztalon, ezen a napon már van foglalás ebben az idősávban.",
        });
      }

      const updateSql = `
        UPDATE reservations
        SET
          reservation_date = ?,
          reservation_time = ?,
          end_time = ?,
          table_number = ?,
          status = CASE
            WHEN status = 'confirmed' THEN 'pending'
            ELSE status
          END
        WHERE id = ? AND user_id = ? AND status != 'cancelled'
      `;

      db.query(
        updateSql,
        [date, mysqlStart, mysqlEnd, tableNum, reservationId, userId],
        (err3, result) => {
          if (err3) {
            console.error("DB hiba (idősáv módosítás):", err3);
            return res.status(500).json({
              success: false,
              message: "Hiba történt az idősáv módosítása közben.",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "Nem sikerült módosítani a foglalást.",
            });
          }

          emitReservationsUpdated();

          res.json({
            success: true,
            message: "Foglalásod időpontját sikeresen módosítottad.",
          });

          const selectSql = `
              SELECT
                id,
                name,
                email,
                reservation_date,
                reservation_time,
                end_time,
                table_number,
                people_count
              FROM reservations
              WHERE id = ? AND user_id = ?
            `;

          db.query(selectSql, [reservationId, userId], (err4, rows2) => {
            if (err4) {
              console.error(
                "DB hiba (foglalás emailhez lekérdezés user time update):",
                err4,
              );
              return;
            }

            if (!rows2 || rows2.length === 0) {
              console.warn(
                "Foglalás nem található email küldéshez (time), id:",
                reservationId,
              );
              return;
            }

            const r = rows2[0];

            const reservationForMail = {
              email: r.email,
              name: r.name,
              date: r.reservation_date,
              timeFrom: r.reservation_time,
              timeTo: r.end_time,
              tableNumber: r.table_number,
              peopleCount: r.people_count,
            };

            sendReservationUserUpdatedEmail(reservationForMail).catch(
              (emailErr) => {
                console.error(
                  "Hiba a foglalás módosítva email küldésekor (time):",
                  emailErr,
                );
              },
            );
          });
        },
      );
    });
  });
}
