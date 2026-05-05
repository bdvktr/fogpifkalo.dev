import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../repositories/db.repository.js";
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  SALT_ROUNDS,
} from "../config/auth.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  return (
    email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

function deleteRefreshTokensForUser(userId) {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM refresh_tokens WHERE user_id = ?";

    db.query(sql, [userId], (err, result) => {
      if (err) {
        console.error("DB hiba (refresh tokenek törlése jelszócsere után):", err);
        return reject(err);
      }

      resolve(result.affectedRows);
    });
  });
}

export function updateProfile(req, res) {
  const userId = req.user.id;
  const name = normalizeText(req.body?.name);
  const email = normalizeEmail(req.body?.email);

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Név és e-mail megadása kötelező.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Érvényes e-mail cím megadása kötelező.",
    });
  }

  const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";

  db.query(sql, [name, email, userId], (err) => {
    if (err) {
      console.error("DB hiba (profil frissítés):", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: "Ez az e-mail cím már használatban van.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Szerver hiba (profil frissítés).",
      });
    }

    const updatedUser = {
      id: userId,
      name,
      email,
      isAdmin: (req.user && req.user.isAdmin) || false,
      isDelivery: (req.user && req.user.isDelivery) || false,
    };

    const accessToken = jwt.sign(updatedUser, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      ACCESS_TOKEN_COOKIE_OPTIONS
    );

    return res.json({
      success: true,
      message: "Profil sikeresen frissítve.",
      user: updatedUser,
    });
  });
}

export function changePassword(req, res) {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "A jelenlegi és az új jelszó megadása kötelező.",
    });
  } else if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "Az új jelszónak különböznie kell a jelenlegi jelszótól.",
    });
  }

  const selectSql = "SELECT password_hash FROM users WHERE id = ? LIMIT 1";

  db.query(selectSql, [userId], async (err, rows) => {
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

    db.query(updateSql, [newHash, userId], async (err2) => {
      if (err2) {
        console.error("DB hiba (jelszó frissítés):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó frissítése).",
        });
      }

      try {
        await deleteRefreshTokensForUser(userId);
      } catch (tokenErr) {
        return res.status(500).json({
          success: false,
          message: "A jelszó frissült, de a munkamenetek lezárása nem sikerült. Kérlek jelentkezz ki és be újra.",
        });
      }

      res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

      return res.json({
        success: true,
        forceLogout: true,
        message: "Jelszó sikeresen frissítve. Biztonsági okból kérlek jelentkezz be újra.",
      });
    });
  });
}
