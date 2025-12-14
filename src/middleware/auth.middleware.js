// src/middleware/auth.middleware.js

import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { db } from "../repositories/db.repository.js";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "../config/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promise-es wrapper a db.query-hez
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * - Megpróbálja az access tokent
 * - Ha lejárt/hibás → refresh token alapján új access (és refresh) + req.user beállítása
 * - Ha semmi nincs → req.user = null
 */
export async function authWithRefreshMiddleware(req, res, next) {
  try {
    req.user = null;

    const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

    // 1) Először próbáljuk az ACCESS tokent verifálni
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.user = decoded; // { id, name, email, isAdmin }
        return next();
      } catch (err) {
        // pl. TokenExpiredError – ez még nem baj, megyünk tovább refresh-re
        console.warn(
          "Access token verify hiba (megyünk tovább refresh-re):",
          err.message
        );
      }
    }

    // 2) Ha nincs érvényes access → próbáljuk a REFRESH tokent
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      // Nincs refresh → nincs user
      req.user = null;
      return next();
    }

    // 2/a) Megkeressük a DB-ben
    const rows = await query(
      "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? LIMIT 1",
      [refreshToken]
    );
    const storedToken = rows[0];

    if (!storedToken) {
      // Nincs ilyen refresh a DB-ben
      req.user = null;
      return next();
    }

    // 2/b) JWT verify a refresh tokenre
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      console.error(
        "Refresh token verify hiba (globális middleware):",
        err.message
      );
      // ha hibás → töröljük a DB-ből is
      try {
        await query("DELETE FROM refresh_tokens WHERE id = ?", [
          storedToken.id,
        ]);
      } catch (deleteErr) {
        console.error(
          "Refresh token törlés hiba verify fail után:",
          deleteErr.message
        );
      }
      req.user = null;
      return next();
    }

    const userId = payload.id;

    // 2/c) Felhasználó lekérése
    const userRows = await query(
      "SELECT id, name, email, is_admin, is_delivery FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const userRow = userRows[0];

    if (!userRow) {
      // Nincs ilyen user → töröljük a refresh tokent is
      try {
        await query("DELETE FROM refresh_tokens WHERE id = ?", [
          storedToken.id,
        ]);
      } catch (deleteErr) {
        console.error(
          "Refresh token törlés hiba (user nem található):",
          deleteErr.message
        );
      }
      req.user = null;
      return next();
    }

    const userPayload = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      isAdmin: !!userRow.is_admin,
      isDelivery: !!userRow.is_delivery,
    };

    // 2/d) Új ACCESS + REFRESH token generálása (rotáció)
    const newAccessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const newRefreshToken = jwt.sign({ id: userRow.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    const decodedNewRefresh = jwt.decode(newRefreshToken);
    const newExpiresAt =
      decodedNewRefresh && decodedNewRefresh.exp
        ? new Date(decodedNewRefresh.exp * 1000)
        : null;

    try {
      await query(
        "UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE id = ?",
        [newRefreshToken, newExpiresAt, storedToken.id]
      );
    } catch (err) {
      console.error(
        "Refresh token rotáció DB hiba (globális middleware):",
        err.message
      );
      req.user = null;
      return next();
    }

    // 2/e) Cookie-k frissítése
    res
      .cookie(
        ACCESS_TOKEN_COOKIE_NAME,
        newAccessToken,
        ACCESS_TOKEN_COOKIE_OPTIONS
      )
      .cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        newRefreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );

    // 2/f) req.user beállítása
    req.user = userPayload;

    return next();
  } catch (err) {
    console.error("authWithRefreshMiddleware hiba:", err);
    // ne döntsön auth hibáról – majd a route/más middleware
    req.user = null;
    return next(err);
  }
}

// --------- Egyszerű require* middlewarek ---------

export function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Bejelentkezés szükséges.",
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    // már ekkor tudjuk: se access, se refresh nem volt használható
    return res.status(401).json({
      success: false,
      message: "Bejelentkezés szükséges.",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin jogosultság szükséges.",
    });
  }

  next();
}

// /admin HTML védelme – itt már a globális middleware frissített, ha tudott
export function requireAdminOrErrorPage(req, res, next) {
  try {
    if (req.user && req.user.isAdmin) {
      return next();
    }

    if (req.user && !req.user.isAdmin) {
      return res
        .status(403)
        .sendFile(path.resolve(__dirname, "../../public/error403.html"));
    }

    return res
      .status(401)
      .sendFile(path.resolve(__dirname, "../../public/error401.html"));
  } catch (err) {
    console.error("requireAdminOrErrorPage hiba:", err);
    return res
      .status(500)
      .sendFile(path.resolve(__dirname, "../../public/error500.html"));
  }
}

export function requireDelivery(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Bejelentkezés szükséges.",
    });
  }

  if (!req.user.isDelivery) {
    return res.status(403).json({
      success: false,
      message: "Futár jogosultság szükséges.",
    });
  }

  return next();
}
