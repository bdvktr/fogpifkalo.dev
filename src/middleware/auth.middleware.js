import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_COOKIE_NAME } from "../config/auth.js";

export function authCookieMiddleware(req, res, next) {
  const token = req.cookies && req.cookies[JWT_COOKIE_NAME];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      console.error("JWT verify error:", err.message);
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

export function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Ehhez a művelethez be kell jelentkezni.",
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      status: 403,
      success: false,
      message: "Nincs jogosultság (admin szükséges).",
      user: {
        id: req.user ? req.user.id : null,
        name: req.user ? req.user.name : null,
        email: req.user ? req.user.email : null,
        isAdmin: req.user ? !!req.user.isAdmin : false,
      },
    });
  }
  next();
}
