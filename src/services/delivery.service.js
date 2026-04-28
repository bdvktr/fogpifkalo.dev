import { db } from "../repositories/db.repository.js";
import { emitPendingOrdersUpdated } from "../config/websocket.js";

// Csak folyamatban lévő rendelések futárnak
export function getPendingOrders(req, res) {
  const sql = `
    SELECT
      o.id,
      o.created_at,
      o.status,
      o.total_price,
      o.shipping_name,
      o.shipping_phone,
      o.shipping_address,
      u.email AS user_email,
      u.name  AS user_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.status = 'pending'
    ORDER BY o.created_at DESC, o.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (delivery pending orders):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (folyamatban lévő rendelések lekérdezése).",
      });
    }

    return res.json({
      success: true,
      orders: rows,
    });
  });
}

// Futár jelzi, hogy átadta a rendelést -> status = 'completed'
export function completeOrder(req, res) {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen rendelés azonosító.",
    });
  }

  // Csak pending -> completed engedélyezett innen
  const sql = `
    UPDATE orders
    SET status = 'completed'
    WHERE id = ? AND status = 'pending'
  `;

  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error("DB hiba (delivery completeOrder):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a rendelés teljesítettre állítása közben.",
      });
    }

    if (result.affectedRows === 0) {
      // vagy nincs ilyen id, vagy nem pending a státusz
      return res.status(400).json({
        success: false,
        message:
          "A rendelés nem található, vagy már nem folyamatban lévő státuszban van.",
      });
    }
    // Futár app real time frissítése
    emitPendingOrdersUpdated();

    return res.json({
      success: true,
      message: "A rendelés státusza sikeresen teljesítettre állítva.",
    });
  });
}

// Egy konkrét rendelés részletei futárnak (fejléc + tételek)
export function getOrderDetails(req, res) {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen rendelés azonosító.",
    });
  }

  const orderSql = `
    SELECT
      o.id,
      o.created_at,
      o.status,
      o.total_price,
      o.shipping_name,
      o.shipping_phone,
      o.shipping_address,
      o.payment_method,
      o.note,
      u.email AS user_email,
      u.name  AS user_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ?
    LIMIT 1
  `;

  const itemsSql = `
  SELECT
    oi.id,
    p.name AS name,
    oi.quantity,
    oi.unit_price
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = ?
  ORDER BY oi.id ASC
`;

  db.query(orderSql, [orderId], (err, orderRows) => {
    if (err) {
      console.error("DB hiba (delivery getOrderDetails - order):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a rendelés lekérdezésekor.",
      });
    }

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "A rendelés nem található.",
      });
    }

    const orderRow = orderRows[0];

    db.query(itemsSql, [orderId], (err2, itemsRows) => {
      if (err2) {
        console.error("DB hiba (delivery getOrderDetails - items):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba a rendelés tételeinek lekérdezésekor.",
        });
      }

      const items = (itemsRows || []).map((row) => ({
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        unit_price: row.unit_price,
      }));

      return res.json({
        success: true,
        order: {
          id: orderRow.id,
          created_at: orderRow.created_at,
          status: orderRow.status,
          total_price: orderRow.total_price,
          shipping_name: orderRow.shipping_name,
          shipping_phone: orderRow.shipping_phone,
          shipping_address: orderRow.shipping_address,
          payment_method: orderRow.payment_method,
          note: orderRow.note,
          user: {
            name: orderRow.user_name,
            email: orderRow.user_email,
          },
          items,
        },
      });
    });
  });
}

// Leadott rendelések futárnak (history)
export function getCompletedOrders(req, res) {
  const sql = `
    SELECT
      o.id,
      o.created_at,
      o.status,
      o.total_price,
      o.shipping_name,
      o.shipping_phone,
      o.shipping_address,
      u.email AS user_email,
      u.name  AS user_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.status = 'completed'
    ORDER BY o.created_at DESC, o.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (delivery completed orders):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (leadott rendelések lekérdezése).",
      });
    }

    return res.json({ success: true, orders: rows });
  });
}

// Futár visszavonja: completed -> pending
export function undoCompleteOrder(req, res) {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Érvénytelen rendelés azonosító." });
  }

  const sql = `
    UPDATE orders
    SET status = 'pending'
    WHERE id = ? AND status = 'completed'
  `;

  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error("DB hiba (delivery undoCompleteOrder):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a visszavonás közben.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "A rendelés nem található, vagy nem leadott (completed) státuszban van.",
      });
    }

    // pending lista frissítése realtime
    emitPendingOrdersUpdated();

    return res.json({
      success: true,
      message: "A rendelés visszavonva (pending).",
    });
  });
}
