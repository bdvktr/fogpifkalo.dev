import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../repositories/db.repository.js";
import {
  JWT_SECRET,
  JWT_COOKIE_NAME,
  JWT_COOKIE_OPTIONS,
  SALT_ROUNDS,
} from "../config/auth.js";

export function updateProfile(req, res) {
  const userId = req.user.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "A név és az e-mail megadása kötelező.",
    });
  }

  const checkSql = "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1";

  db.query(checkSql, [email, userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (email ellenőrzés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (email ellenőrzés).",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ezzel az e-mail címmel már létezik fiók.",
      });
    }

    const updateSql = "UPDATE users SET name = ?, email = ? WHERE id = ?";

    db.query(updateSql, [name, email, userId], (err2) => {
      if (err2) {
        console.error("DB hiba (profil frissítés):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (profil frissítése).",
        });
      }

      const updatedUser = {
        id: userId,
        name,
        email,
        isAdmin: (req.user && req.user.isAdmin) || false,
      };

      const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: "7d" });

      res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);

      return res.json({
        success: true,
        message: "Profil sikeresen frissítve.",
        user: updatedUser,
      });
    });
  });
}

export function changePassword(req, res) {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "A régi és az új jelszó megadása kötelező.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Az új jelszónak legalább 8 karakter hosszúnak kell lennie.",
    });
  }

  const sql = "SELECT password_hash FROM users WHERE id = ? LIMIT 1";

  db.query(sql, [userId], async (err, rows) => {
    if (err) {
      console.error("DB hiba (jelszó lekérdezés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (jelszó lekérdezése).",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Felhasználó nem található.",
      });
    }

    const storedHash = rows[0].password_hash;

    const match = await bcrypt.compare(currentPassword, storedHash);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "A jelenlegi jelszó nem helyes.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updateSql = "UPDATE users SET password_hash = ? WHERE id = ?";

    db.query(updateSql, [newHash, userId], (err2) => {
      if (err2) {
        console.error("DB hiba (jelszó frissítés):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó frissítése).",
        });
      }

      return res.json({
        success: true,
        message: "Jelszó sikeresen frissítve.",
      });
    });
  });
}
