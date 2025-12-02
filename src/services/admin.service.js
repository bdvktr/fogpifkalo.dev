import { db } from "../repositories/db.repository.js";
import {
  sendReservationConfirmedEmail,
  sendReservationCancelledEmail,
  sendOrderCompletedEmail,
  sendOrderCancelledEmail,
} from "./email.service.js";

// Termékek
export function getProducts(req, res) {
  const sql = `
    SELECT id, name, description, price, is_active, category, image_url
    FROM products
    ORDER BY category, name
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/admin/products):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a termékek lekérdezésekor.",
      });
    }

    res.json({
      success: true,
      products: rows,
    });
  });
}

export function createProduct(req, res) {
  const { name, description, price, image_url, is_active, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "A név és az ár kötelező.",
    });
  }

  const safeCategory =
    category === "burger" ||
    category === "side" ||
    category === "drink" ||
    category === "sauce"
      ? category
      : "burger";

  let activeFlag = 1;
  if (typeof is_active !== "undefined") {
    if (is_active === true || is_active === 1 || is_active === "1") {
      activeFlag = 1;
    } else {
      activeFlag = 0;
    }
  }

  const sql = `
    INSERT INTO products (name, description, price, image_url, is_active, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      description || null,
      price,
      image_url || "",
      activeFlag,
      safeCategory,
    ],
    (err, result) => {
      if (err) {
        console.error("DB hiba (product insert):", err);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba a termék mentésekor.",
        });
      }

      res.json({
        success: true,
        productId: result.insertId,
      });
    }
  );
}

export function updateProduct(req, res) {
  const productId = req.params.id;
  const { name, description, price, image_url, category, is_active } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "A név és az ár megadása kötelező.",
    });
  }

  const safeCategory =
    category === "burger" ||
    category === "side" ||
    category === "drink" ||
    category === "sauce"
      ? category
      : "burger";

  let activeFlag = 1;
  if (typeof is_active !== "undefined") {
    if (is_active === true || is_active === 1 || is_active === "1") {
      activeFlag = 1;
    } else {
      activeFlag = 0;
    }
  }

  const sql = `
    UPDATE products
    SET 
      name = ?, 
      description = ?, 
      price = ?, 
      image_url = ?, 
      is_active = ?, 
      category = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      name,
      description || null,
      price,
      image_url || "",
      activeFlag,
      safeCategory,
      productId,
    ],
    (err, result) => {
      if (err) {
        console.error("DB hiba (admin products update):", err);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (termék módosítása).",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "A termék nem található.",
        });
      }

      return res.json({
        success: true,
        message: "Termék frissítve.",
      });
    }
  );
}

export function softDeleteProduct(req, res) {
  const productId = req.params.id;

  const sql = "UPDATE products SET is_active = 0 WHERE id = ?";

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error("DB hiba (admin products soft delete):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (termék inaktiválása).",
      });
    }

    return res.json({
      success: true,
      message: "Termék törölve. (inaktiválva)",
    });
  });
}

export function activateProduct(req, res) {
  const productId = req.params.id;

  const sql = "UPDATE products SET is_active = 1 WHERE id = ?";

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error("DB hiba (admin product activate):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (termék aktiválása).",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "A termék nem található.",
      });
    }

    return res.json({
      success: true,
      message: "Termék újraaktiválva.",
    });
  });
}

// Rendelések admin
export function getOrders(req, res) {
  const sql = `
    SELECT
      o.id,
      o.created_at,
      o.status,
      o.total_price,
      u.email AS user_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC, o.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (admin orders select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (rendelések lekérdezése).",
      });
    }

    return res.json({
      success: true,
      orders: rows,
    });
  });
}

export function getOrderDetails(req, res) {
  const orderId = req.params.id;

  const sql = `
    SELECT
      o.id AS order_id,
      o.created_at,
      o.status,
      o.total_price,
      u.email AS user_email,
      u.name AS user_name,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      p.name AS product_name
    FROM orders o
    JOIN users u       ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p    ON p.id = oi.product_id
    WHERE o.id = ?
    ORDER BY oi.id ASC
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) {
      console.error("DB hiba (admin order details):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (rendelés részleteinek lekérdezése).",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "A rendelés nem található.",
      });
    }

    const first = rows[0];

    const order = {
      id: first.order_id,
      created_at: first.created_at,
      status: first.status,
      total_price: Number(first.total_price),
      user: {
        email: first.user_email,
        name: first.user_name,
      },
      items: rows.map((r) => ({
        product_id: r.product_id,
        name: r.product_name,
        quantity: r.quantity,
        unit_price: Number(r.unit_price),
      })),
    };

    return res.json({
      success: true,
      order,
    });
  });
}

export function updateOrderStatus(req, res) {
  const orderId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ["pending", "completed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen státusz.",
      details: status,
    });
  }

  const sql = "UPDATE orders SET `status` = ? WHERE id = ?";

  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error(
        "DB hiba (admin update order status):",
        err.code,
        err.sqlMessage
      );
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (rendelés státusz módosítása).",
        details: err.sqlMessage || null,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "A rendelés nem található.",
      });
    }

    // Kliensnek azonnal válaszolunk
    res.json({
      success: true,
      message: "Rendelés státusza frissítve.",
    });

    // Ha completed VAGY cancelled → emailt kell küldeni
    if (status === "completed" || status === "cancelled") {
      const selectSql = `
        SELECT
          o.id,
          o.total_price,
          o.shipping_name,
          o.shipping_address,
          o.payment_method,
          u.email,
          u.name
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE o.id = ?
      `;

      db.query(selectSql, [orderId], (selErr, rows) => {
        if (selErr) {
          console.error(
            "DB hiba (rendelés adatainak lekérése emailhez):",
            selErr
          );
          return;
        }

        if (!rows || rows.length === 0) {
          console.warn("Rendelés nem található email küldéshez, id:", orderId);
          return;
        }

        const row = rows[0];

        const orderForMail = {
          email: row.email,
          name: row.shipping_name || row.name,
          orderId: row.id,
          totalPrice: row.total_price,
          shippingAddress: row.shipping_address,
          paymentMethod: row.payment_method,
        };

        if (status === "completed") {
          sendOrderCompletedEmail(orderForMail).catch((emailErr) => {
            console.error(
              "Hiba az order completed email küldésekor:",
              emailErr
            );
          });
        } else if (status === "cancelled") {
          sendOrderCancelledEmail(orderForMail).catch((emailErr) => {
            console.error(
              "Hiba az order cancelled email küldésekor:",
              emailErr
            );
          });
        }
      });
    }
  });
}

// Foglalások admin
export function getReservations(req, res) {
  const sql = `
    SELECT
      id,
      table_number,
      reservation_date,
      reservation_time,
      end_time,
      name,
      email,
      phone,
      people_count,
      note,
      status,
      created_at
    FROM reservations
    ORDER BY reservation_date DESC, reservation_time DESC, id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (admin reservations select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a foglalások lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      reservations: rows,
    });
  });
}

export function updateReservationStatus(req, res) {
  const reservationId = req.params.id;
  const { status } = req.body || {};

  const allowedStatuses = ["pending", "confirmed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen státusz.",
      details: status,
    });
  }

  const sql = "UPDATE reservations SET status = ? WHERE id = ?";

  db.query(sql, [status, reservationId], (err, result) => {
    if (err) {
      console.error("DB hiba (admin update reservation status):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a foglalás státusz módosításakor.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "A foglalás nem található.",
      });
    }

    // A kliensnek azonnal válaszolunk
    res.json({
      success: true,
      message: "Foglalás státusza frissítve.",
    });

    // Ha confirmed VAGY cancelled → emailt kell küldeni
    if (status === "confirmed" || status === "cancelled") {
      const selectSql = `
        SELECT 
          id,
          name,
          email,
          reservation_date,
          reservation_time,
          end_time,
          table_number,
          people_count
        FROM reservations
        WHERE id = ?
      `;

      db.query(selectSql, [reservationId], (selectErr, rows) => {
        if (selectErr) {
          console.error(
            "DB hiba (foglalás adatainak lekérése emailhez):",
            selectErr
          );
          return;
        }

        if (!rows || rows.length === 0) {
          console.warn(
            "Foglalás nem található email küldéshez, id:",
            reservationId
          );
          return;
        }

        const reservation = rows[0];

        const reservationForMail = {
          email: reservation.email,
          name: reservation.name,
          date: reservation.reservation_date,
          timeFrom: reservation.reservation_time,
          timeTo: reservation.end_time,
          tableNumber: reservation.table_number,
          peopleCount: reservation.people_count,
        };

        if (status === "confirmed") {
          sendReservationConfirmedEmail(reservationForMail).catch(
            (emailErr) => {
              console.error("Hiba a visszaigazoló email küldésekor:", emailErr);
            }
          );
        } else if (status === "cancelled") {
          sendReservationCancelledEmail(reservationForMail).catch(
            (emailErr) => {
              console.error("Hiba a törlés email küldésekor:", emailErr);
            }
          );
        }
      });
    }
  });
}

export function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Nem érkezett fájl.",
    });
  }

  // A Multer a filename-t beállította, a public/uploads/products-ig az útvonal fix
  const imageUrl = "/uploads/products/" + req.file.filename;

  return res.json({
    success: true,
    imageUrl,
  });
}
