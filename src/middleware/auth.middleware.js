// src/middleware/auth.middleware.js

import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { db } from "../repositories/db.repository.js";
import { hashRefreshToken } from "../config/tokenHash.js";
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
 * - Ha nincs/lejárt/hibás → req.user = null
 * - NEM refresh-el automatikusan (azt a frontend hívja /api/refresh-en)
 */
export async function authWithRefreshMiddleware(req, res, next) {
  try {
    req.user = null;

    const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

    if (!accessToken) {
      return next();
    }

    try {
      const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
      req.user = decoded; // { id, name, email, isAdmin, isDelivery }
      return next();
    } catch (err) {
      // TokenExpiredError, JsonWebTokenError, stb.
      // Itt direkt nem refresh-elünk.
      req.user = null;
      return next();
    }
  } catch (err) {
    console.error("authWithRefreshMiddleware hiba:", err);
    req.user = null;
    return next(err);
  }
}

// Admin felület /admin védelme refresh-eléssel
export async function adminRefreshMiddleware(req, res, next) {
  try {
    // ha már van érvényes access tokenből user, nincs dolgunk
    if (req.user) return next();

    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) return next();

    // DB-ben megvan-e a refresh token
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const rows = await query(
      "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? LIMIT 1",
      [refreshTokenHash]
    );
    const storedToken = rows[0];
    if (!storedToken) return next();

    // refresh token verify
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      // hibás/lejárt refresh → takarítsuk DB-ből
      try {
        await query("DELETE FROM refresh_tokens WHERE id = ?", [
          storedToken.id,
        ]);
      } catch (_) {}
      return next();
    }

    const userId = payload.id;

    // user betöltés (figyelj: is_delivery is kell!)
    const userRows = await query(
      "SELECT id, name, email, is_admin, is_delivery FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const userRow = userRows[0];
    if (!userRow) {
      try {
        await query("DELETE FROM refresh_tokens WHERE id = ?", [
          storedToken.id,
        ]);
      } catch (_) {}
      return next();
    }

    const userPayload = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      isAdmin: !!userRow.is_admin,
      isDelivery: !!userRow.is_delivery,
    };

    // token rotáció
    const newAccessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const newRefreshToken = jwt.sign({ id: userRow.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    const decodedNewRefresh = jwt.decode(newRefreshToken);
    const newExpiresAt = decodedNewRefresh?.exp
      ? new Date(decodedNewRefresh.exp * 1000)
      : null;

    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    await query(
      "UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE id = ?",
      [newRefreshTokenHash, newExpiresAt, storedToken.id]
    );

    // cookie-k frissítése
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

    // req.user beállítása, hogy a requireAdminOrErrorPage átengedjen
    req.user = userPayload;

    return next();
  } catch (err) {
    console.error("adminRefreshMiddleware hiba:", err);
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
