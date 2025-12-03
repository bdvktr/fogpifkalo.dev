import { db } from "../repositories/db.repository.js";

/**
 * Egy admin művelet naplózása.
 *
 * @param {Request} req - az express req (req.user-ben van az admin)
 * @param {Object} options
 * @param {string} options.action - pl. "product.create", "order.status.update"
 * @param {string} [options.entityType] - pl. "product", "order", "reservation"
 * @param {number|null} [options.entityId] - érintett entitás azonosítója
 * @param {Object|null} [options.details] - tetszőleges kiegészítő adat
 */
export function logAdminAction(req, { action, entityType, entityId, details }) {
  try {
    const adminUserId = req.user && req.user.id ? req.user.id : null;
    const ipAddress = req.ip || null;
    const userAgent = req.headers["user-agent"] || null;
    const detailsJson = details ? JSON.stringify(details) : null;

    const sql = `
      INSERT INTO admin_audit_logs
        (admin_user_id, action, entity_type, entity_id, details_json, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        adminUserId,
        action,
        entityType || null,
        entityId || null,
        detailsJson,
        ipAddress,
        userAgent,
      ],
      (err) => {
        if (err) {
          console.error("DB hiba (admin audit log insert):", err);
          // fontos: NEM dobunk hibát, nehogy blokkoljuk az eredeti admin műveletet
        }
      }
    );
  } catch (err) {
    console.error("Hiba az admin audit logolás során:", err);
  }
}

/**
 * Audit logok lekérdezése (read-only).
 * GET /api/admin/logs
 */
export function getAdminLogs(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;

  const sql = `
    SELECT
      l.id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.details_json,
      l.ip_address,
      l.user_agent,
      l.created_at,
      u.email AS admin_email,
      u.name AS admin_name
    FROM admin_audit_logs l
    LEFT JOIN users u ON u.id = l.admin_user_id
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [limit, offset], (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/admin/logs):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba az admin log lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      logs: rows || [],
    });
  });
}
