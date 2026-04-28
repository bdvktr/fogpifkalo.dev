import { db } from "../repositories/db.repository.js";
import { sendOrderPlacedEmail } from "./email.service.js";
import { emitPendingOrdersUpdated } from "../config/websocket.js";

function parseConfigJson(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function serializeConfigJson(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function checkout(req, res) {
  const userId = req.user.id;

  const shippingName = String(req.body?.shippingName || "").trim();
  const shippingPhone = String(req.body?.shippingPhone || "").trim();
  const shippingCity = String(req.body?.shippingCity || "").trim();
  const shippingStreet = String(req.body?.shippingStreet || "").trim();
  const shippingHouseNumber = String(
    req.body?.shippingHouseNumber || "",
  ).trim();
  const allowedCities = [
    "Mohács",
    "Somberek",
    "Bozsok",
    "Bár",
    "Szőlőhegy",
    "Sátorhely",
    "Kölked",
    "Lánycsók",
  ];
  const note = String(req.body?.note || "").trim();
  const paymentMethod = req.body?.paymentMethod;

  if (
    !shippingName ||
    !shippingPhone ||
    !shippingCity ||
    !shippingStreet ||
    !shippingHouseNumber
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A szállítási név, telefonszám, város, utca és házszám megadása kötelező.",
    });
  }

  if (!allowedCities.includes(shippingCity)) {
    return res.status(400).json({
      success: false,
      message: "A megadott településre jelenleg nem szállítunk.",
    });
  }

  const shippingAddress = `${shippingCity}, ${shippingStreet}, ${shippingHouseNumber}`;

  const safePayment =
    paymentMethod === "card" || paymentMethod === "cash"
      ? paymentMethod
      : "cash";

  const cartSql = `
    SELECT 
      ci.product_id,
      ci.quantity,
      ci.config_json,
      ci.config_key,
      p.name,
      p.price
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `;

  const orderInsertSql = `
    INSERT INTO orders 
      (user_id, total_price, status, shipping_name, shipping_phone, shipping_address, payment_method, note)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `;

  const orderItemsSql = `
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, config_json)
    VALUES ?
  `;

  const clearCartSql = "DELETE FROM cart_items WHERE user_id = ?";

  db.getConnection((connectionErr, connection) => {
    if (connectionErr) {
      console.error("DB hiba (checkout kapcsolat):", connectionErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a rendelés előkészítésekor.",
      });
    }

    const rollbackAndRelease = (statusCode, message, err) => {
      if (err) {
        console.error(message, err);
      }

      connection.rollback(() => {
        connection.release();
        return res.status(statusCode).json({
          success: false,
          message,
        });
      });
    };

    connection.beginTransaction((txErr) => {
      if (txErr) {
        console.error("DB hiba (checkout tranzakció indítás):", txErr);
        connection.release();
        return res.status(500).json({
          success: false,
          message: "Szerver hiba a rendelés előkészítésekor.",
        });
      }

      connection.query(cartSql, [userId], (cartErr, cartRows) => {
        if (cartErr) {
          return rollbackAndRelease(
            500,
            "Szerver hiba a kosár lekérdezésekor.",
            cartErr,
          );
        }

        if (!cartRows || cartRows.length === 0) {
          return rollbackAndRelease(
            400,
            "A kosarad üres, nem lehet rendelést leadni.",
          );
        }

        let totalPrice = 0;
        cartRows.forEach((row) => {
          totalPrice += Number(row.price) * Number(row.quantity);
        });

        connection.query(
          orderInsertSql,
          [
            userId,
            totalPrice,
            shippingName,
            shippingPhone,
            shippingAddress,
            safePayment,
            note || null,
          ],
          (orderErr, result) => {
            if (orderErr) {
              return rollbackAndRelease(
                500,
                "Szerver hiba a rendelés mentésekor.",
                orderErr,
              );
            }

            const orderId = result.insertId;
            const orderItemsValues = cartRows.map((row) => [
              orderId,
              row.product_id,
              row.quantity,
              row.price,
              serializeConfigJson(row.config_json),
            ]);

            connection.query(orderItemsSql, [orderItemsValues], (itemsErr) => {
              if (itemsErr) {
                return rollbackAndRelease(
                  500,
                  "Szerver hiba a rendelés tételeinek mentésekor.",
                  itemsErr,
                );
              }

              connection.query(clearCartSql, [userId], (clearErr) => {
                if (clearErr) {
                  return rollbackAndRelease(
                    500,
                    "Szerver hiba a kosár ürítésekor.",
                    clearErr,
                  );
                }

                connection.commit((commitErr) => {
                  if (commitErr) {
                    return rollbackAndRelease(
                      500,
                      "Szerver hiba a rendelés véglegesítésekor.",
                      commitErr,
                    );
                  }

                  connection.release();

                  const userEmail = req.user?.email;
                  const userName = req.user?.name;

                  sendOrderPlacedEmail({
                    email: userEmail,
                    name: shippingName || userName,
                    orderId,
                    totalPrice,
                    shippingAddress,
                    paymentMethod: safePayment,
                  }).catch((emailErr) => {
                    console.error(
                      "Hiba az order placed email küldésekor:",
                      emailErr,
                    );
                  });

                  emitPendingOrdersUpdated();

                  return res.json({
                    success: true,
                    message: "Rendelésedet fogadtuk, köszönjük!",
                    orderId,
                  });
                });
              });
            });
          },
        );
      });
    });
  });
}

export function getMyOrders(req, res) {
  const userId = req.user.id;

  const sql = `
    SELECT 
      o.id AS order_id,
      o.created_at,
      o.status,
      o.total_price,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      oi.config_json,
      p.name AS product_name,
      s.name AS sauce_name
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN products s
      ON s.id = CAST(
        JSON_UNQUOTE(JSON_EXTRACT(oi.config_json, '$.sauceId')) AS UNSIGNED
      )
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC, o.id DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (orders select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (rendelések lekérdezése).",
      });
    }

    if (rows.length === 0) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const ordersMap = {};

    rows.forEach((row) => {
      const id = row.order_id;
      if (!ordersMap[id]) {
        ordersMap[id] = {
          id: id,
          created_at: row.created_at,
          status: row.status,
          total_price: Number(row.total_price),
          items: [],
        };
      }

      const config = parseConfigJson(row.config_json);

      if (config && row.sauce_name) {
        config.sauceName = row.sauce_name;
      }

      ordersMap[id].items.push({
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        unit_price: Number(row.unit_price),
        config,
      });
    });

    const orders = Object.values(ordersMap);

    return res.json({
      success: true,
      orders,
    });
  });
}
