import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

function getPasswordValue(value) {
  return typeof value === "string" ? value : "";
}

function buildUserPayloadFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: !!row.is_admin,
    isDelivery: !!row.is_delivery,
  };
}

function generateAccessToken(userPayload) {
  return jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function saveRefreshToken(userId, token) {
  const decoded = jwt.decode(token);
  const expiresAt =
    decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;

  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
    const tokenHash = hashRefreshToken(token);
    db.query(sql, [userId, tokenHash, expiresAt], (err, result) => {
      if (err) {
        console.error("DB hiba (refresh token mentés):", err);
        return reject(err);
      }
      resolve(result.insertId);
    });
  });
}

function deleteRefreshToken(token) {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM refresh_tokens WHERE token = ?";
    const tokenHash = hashRefreshToken(token);
    db.query(sql, [tokenHash], (err, result) => {
      if (err) {
        console.error("DB hiba (refresh token törlés):", err);
        return reject(err);
      }
      resolve(result.affectedRows);
    });
  });
}

function findRefreshToken(token) {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? LIMIT 1";
    const tokenHash = hashRefreshToken(token);
    db.query(sql, [tokenHash], (err, rows) => {
      if (err) {
        console.error("DB hiba (refresh token keresés):", err);
        return reject(err);
      }
      resolve(rows[0] || null);
    });
  });
}

function updateRefreshTokenRow(id, newToken) {
  const decoded = jwt.decode(newToken);
  const expiresAt =
    decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;

  return new Promise((resolve, reject) => {
    const sql =
      "UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE id = ?";
    const tokenHash = hashRefreshToken(newToken);
    db.query(sql, [tokenHash, expiresAt, id], (err, result) => {
      if (err) {
        console.error("DB hiba (refresh token frissítés):", err);
        return reject(err);
      }
      resolve(result.affectedRows);
    });
  });
}

export async function register(req, res) {
  const name = normalizeText(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const password = getPasswordValue(req.body?.password);
  const passwordConfirm = getPasswordValue(req.body?.passwordConfirm);

  if (!name || !email || !password || !passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: "Minden mező kitöltése kötelező.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Érvényes e-mail cím megadása kötelező.",
    });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: "A két jelszó nem egyezik.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "A jelszónak legalább 8 karakter hosszúnak kell lennie.",
    });
  }

  const checkSql = "SELECT id FROM users WHERE email = ? LIMIT 1";
  db.query(checkSql, [email], async (err, rows) => {
    if (err) {
      console.error("DB hiba (reg check):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (regisztráció ellenőrzés).",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ezzel az e-mail címmel már regisztráltak.",
      });
    }

    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);

      const insertSql =
        "INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)";
      db.query(
        insertSql,
        [name, email, hash, false],
        async (insertErr, result) => {
          if (insertErr) {
            console.error("DB hiba (reg insert):", insertErr);
            return res.status(500).json({
              success: false,
              message: "Szerver hiba (regisztráció mentés).",
            });
          }

          const newUserId = result.insertId;

          const user = {
            id: newUserId,
            name,
            email,
            isAdmin: false,
          };

          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(newUserId);

          try {
            await saveRefreshToken(newUserId, refreshToken);
          } catch (tokenErr) {
            return res.status(500).json({
              success: false,
              message: "Szerver hiba (refresh token mentés).",
            });
          }

          res
            .cookie(
              ACCESS_TOKEN_COOKIE_NAME,
              accessToken,
              ACCESS_TOKEN_COOKIE_OPTIONS
            )
            .cookie(
              REFRESH_TOKEN_COOKIE_NAME,
              refreshToken,
              REFRESH_TOKEN_COOKIE_OPTIONS
            );

          return res.json({
            success: true,
            message: "Sikeres regisztráció.",
            user,
          });
        }
      );
    } catch (hashErr) {
      console.error("Jelszó hash hiba:", hashErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (jelszó hash-elés).",
      });
    }
  });
}

export function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = getPasswordValue(req.body?.password);

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "E-mail és jelszó megadása kötelező.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Hibás e-mail vagy jelszó.",
    });
  }

  const sql =
    "SELECT id, name, email, password_hash, is_admin, is_delivery FROM users WHERE email = ? LIMIT 1";

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error("DB hiba (login select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (login lekérdezés).",
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Hibás e-mail vagy jelszó.",
      });
    }

    const userRow = rows[0];
    const storedHash = userRow.password_hash;

    bcrypt.compare(password, storedHash, async (compareErr, isMatch) => {
      if (compareErr) {
        console.error("Jelszó összehasonlítási hiba:", compareErr);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó ellenőrzés).",
        });
      }

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Hibás e-mail vagy jelszó.",
        });
      }

      const userData = buildUserPayloadFromRow(userRow);

      const accessToken = generateAccessToken(userData);
      const refreshToken = generateRefreshToken(userData.id);

      try {
        await saveRefreshToken(userData.id, refreshToken);
      } catch (tokenErr) {
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (refresh token mentés).",
        });
      }

      res
        .cookie(
          ACCESS_TOKEN_COOKIE_NAME,
          accessToken,
          ACCESS_TOKEN_COOKIE_OPTIONS
        )
        .cookie(
          REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          REFRESH_TOKEN_COOKIE_OPTIONS
        );

      return res.json({
        success: true,
        message: "Sikeres bejelentkezés.",
        user: userData,
      });
    });
  });
}

export function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ loggedIn: false, user: null });
  }

  return res.json({
    loggedIn: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: !!req.user.isAdmin,
      isDelivery: !!req.user.isDelivery,
    },
  });
}

export function adminSelf(req, res) {
  return res.status(200).json({
    loggedIn: true,
    message: "Admin panel elérése sikeres!",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: !!req.user.isAdmin,
      isDelivery: !!req.user.isDelivery,
    },
  });
}

export async function logout(req, res) {
  const refreshToken =
    req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    try {
      await deleteRefreshToken(refreshToken);
    } catch (err) {
      console.error("Refresh token törlés hiba logoutnál:", err);
    }
  }

  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

  return res.json({ success: true, message: "Sikeres kilépés." });
}

export async function refresh(req, res) {
  const refreshToken =
    req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Nincs refresh token." });
  }

  let storedToken;
  try {
    storedToken = await findRefreshToken(refreshToken);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Szerver hiba (refresh token keresés).",
    });
  }

  if (!storedToken) {
    return res
      .status(401)
      .json({ success: false, message: "Érvénytelen refresh token." });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.error("Refresh token verify hiba:", err);
    try {
      await deleteRefreshToken(refreshToken);
    } catch (deleteErr) {
      console.error("Refresh token törlés verify hiba után:", deleteErr);
    }

    return res.status(401).json({
      success: false,
      message: "Lejárt vagy érvénytelen refresh token.",
    });
  }

  const userId = payload.id;

  const sql =
    "SELECT id, name, email, is_admin, is_delivery FROM users WHERE id = ? LIMIT 1";

  db.query(sql, [userId], async (err, rows) => {
    if (err) {
      console.error("DB hiba (refresh user select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (refresh user lekérdezés).",
      });
    }

    if (rows.length === 0) {
      try {
        await deleteRefreshToken(refreshToken);
      } catch (deleteErr) {
        console.error("Refresh token törlés nem létező userhez:", deleteErr);
      }

      return res
        .status(401)
        .json({ success: false, message: "Felhasználó nem található." });
    }

    const userRow = rows[0];
    const userData = buildUserPayloadFromRow(userRow);

    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData.id);

    try {
      await updateRefreshTokenRow(storedToken.id, newRefreshToken);
    } catch (updateErr) {
      console.error("DB hiba (refresh token rotáció):", updateErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (refresh token frissítés).",
      });
    }

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

    return res.json({
      success: true,
      message: "Access token frissítve.",
      user: userData,
    });
  });
}
