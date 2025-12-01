import { db } from "../repositories/db.repository.js";

export function ping(req, res) {
  res.json({ message: "BurgerBázis backend él 🚀" });
}

export function dbTest(req, res) {
  db.query("SELECT 1 + 1 AS result", (err, rows) => {
    if (err) {
      console.error("DB hiba:", err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    res.json({ db_ok: true, result: rows[0].result });
  });
}
