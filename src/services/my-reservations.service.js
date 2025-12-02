import { db } from "../repositories/db.repository.js";
import {
  sendReservationUserUpdatedEmail,
  sendReservationUserCancelledEmail,
} from "./email.service.js";

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
          err2
        );
        return;
      }

      if (!rows || rows.length === 0) {
        console.warn(
          "Foglalás nem található user lemondás emailhez, id:",
          reservationId
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
            emailErr
          );
        }
      );
    });
  });
}

export function updateMyReservationDetails(req, res) {
  const userId = req.user.id;
  const reservationId = req.params.id;
  const { peopleCount, note } = req.body;

  if (!peopleCount || isNaN(Number(peopleCount)) || Number(peopleCount) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Érvénytelen létszám." });
  }

  const sql = `
    UPDATE reservations
    SET people_count = ?, note = ?
    WHERE id = ? 
      AND user_id = ? 
      AND status != 'cancelled'
  `;

  db.query(
    sql,
    [Number(peopleCount), note || null, reservationId, userId],
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

      // 💌 válasz a usernek
      res.json({
        success: true,
        message: "Foglalásod létszámát sikeresen módosítottad.",
      });

      // 💌 email a módosításról
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
            err2
          );
          return;
        }

        if (!rows || rows.length === 0) {
          console.warn(
            "Foglalás nem található email küldéshez (details), id:",
            reservationId
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

        sendReservationUserUpdatedEmail(reservationForMail).catch((emailErr) => {
          console.error(
            "Hiba a foglalás módosítva email küldésekor (details):",
            emailErr
          );
        });
      });
    }
  );
}

export function updateMyReservationTime(req, res) {
  const userId = req.user.id;
  const reservationId = req.params.id;

  const { date, timeFrom, timeTo, tableNumber } = req.body;

  if (!date || !timeFrom || !timeTo || !tableNumber) {
    return res.status(400).json({
      success: false,
      message:
        "Dátum, kezdési és záró idő, valamint asztalszám megadása kötelező.",
    });
  }

  const tableNum = Number(tableNumber);
  if (!Number.isInteger(tableNum) || tableNum <= 0) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen asztalszám.",
    });
  }

  const [fromH, fromM] = timeFrom.split(":").map(Number);
  const [toH, toM] = timeTo.split(":").map(Number);

  if (isNaN(fromH) || isNaN(fromM) || isNaN(toH) || isNaN(toM)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen időformátum. Használj HH:MM formátumot.",
    });
  }

  const startMinutes = fromH * 60 + fromM;
  const endMinutes = toH * 60 + toM;

  if (endMinutes <= startMinutes) {
    return res.status(400).json({
      success: false,
      message: "A befejezésnek későbbinek kell lennie, mint a kezdésnek.",
    });
  }

  const now = new Date();
  const newStart = new Date(date);
  newStart.setHours(fromH, fromM, 0, 0);

  if (newStart.getTime() <= now.getTime()) {
    return res.status(400).json({
      success: false,
      message: "A foglalás új időpontja nem lehet a múltban.",
    });
  }

  const mysqlStart = `${timeFrom}:00`;
  const mysqlEnd = `${timeTo}:00`;

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

    if (rows.length === 0) {
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
      SELECT id
      FROM reservations
      WHERE 
        table_number = ?
        AND reservation_date = ?
        AND status != 'cancelled'
        AND id <> ?
        AND NOT (
          end_time <= ? OR
          reservation_time >= ?
        )
    `;

    db.query(
      overlapSql,
      [tableNum, date, reservationId, mysqlStart, mysqlEnd],
      (err2, conflicts) => {
        if (err2) {
          console.error("DB hiba (ütközésellenőrzés módosításkor):", err2);
          return res.status(500).json({
            success: false,
            message: "Hiba történt az ütközések ellenőrzésekor.",
          });
        }

        if (conflicts.length > 0) {
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
            table_number = ?
          WHERE id = ? AND user_id = ?
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

            // 💌 válasz a usernek
            res.json({
              success: true,
              message: "Foglalásod időpontját sikeresen módosítottad.",
            });

            // 💌 email a módosításról
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

            db.query(selectSql, [reservationId, userId], (err4, rows) => {
              if (err4) {
                console.error(
                  "DB hiba (foglalás emailhez lekérdezés user time update):",
                  err4
                );
                return;
              }

              if (!rows || rows.length === 0) {
                console.warn(
                  "Foglalás nem található email küldéshez (time), id:",
                  reservationId
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
                    "Hiba a foglalás módosítva email küldésekor (time):",
                    emailErr
                  );
                }
              );
            });
          }
        );
      }
    );
  });
}
