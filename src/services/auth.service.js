import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../repositories/db.repository.js";
import {
  JWT_SECRET,
  JWT_COOKIE_NAME,
  JWT_COOKIE_OPTIONS,
  SALT_ROUNDS,
} from "../config/auth.js";

export async function register(req, res) {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: "Minden mező kitöltése kötelező.",
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
      console.error("DB hiba (email ellenőrzés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (email ellenőrzése).",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ezzel az e-mail címmel már létezik fiók.",
      });
    }

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const insertSql =
        "INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 0)";

      db.query(insertSql, [name, email, passwordHash], (err2, result) => {
        if (err2) {
          console.error("DB hiba (regisztráció):", err2);
          return res.status(500).json({
            success: false,
            message: "Szerver hiba (regisztráció).",
          });
        }

        const newUserId = result.insertId;

        const user = {
          id: newUserId,
          name,
          email,
          isAdmin: false,
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

        res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);

        return res.json({
          success: true,
          message: "Sikeres regisztráció.",
          user,
        });
      });
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "E-mail és jelszó megadása kötelező." });
  }

  const sql =
    "SELECT id, name, email, password_hash, is_admin FROM users WHERE email = ? LIMIT 1";

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error("DB hiba (login select):", err);
      return res
        .status(500)
        .json({ success: false, message: "Szerver hiba (login lekérdezés)." });
    }

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Hibás e-mail vagy jelszó." });
    }

    const user = rows[0];

    bcrypt.compare(password, user.password_hash, (cmpErr, isMatch) => {
      if (cmpErr) {
        console.error("bcrypt hiba (compare):", cmpErr);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó ellenőrzés).",
        });
      }

      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Hibás e-mail vagy jelszó." });
      }

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: !!user.is_admin,
      };

      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "7d" });

      res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);

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
    },
  });
}

export function adminSelf(req, res) {
  return res.status(200).json({
    status: 200,
    success: true,
    loggedIn: true,
    message: "Admin panel elérése sikeres!",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: !!req.user.isAdmin,
    },
  });
}

export function logout(req, res) {
  res.clearCookie(JWT_COOKIE_NAME);
  return res.json({ success: true, message: "Sikeres kilépés." });
}
