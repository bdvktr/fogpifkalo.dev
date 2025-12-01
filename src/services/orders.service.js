import { db } from "../repositories/db.repository.js";

export function checkout(req, res) {
  const userId = req.user.id;

  const { shippingName, shippingPhone, shippingAddress, paymentMethod, note } =
    req.body || {};

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return res.status(400).json({
      success: false,
      message: "A szállítási név, telefonszám és cím megadása kötelező.",
    });
  }

  const safePayment =
    paymentMethod === "card" || paymentMethod === "cash"
      ? paymentMethod
      : "cash";

  const cartSql = `
    SELECT 
      ci.product_id,
      ci.quantity,
      p.name,
      p.price
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `;

  db.query(cartSql, [userId], (err, cartRows) => {
    if (err) {
      console.error("DB hiba (cart lekérdezés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a kosár lekérdezésekor.",
      });
    }

    if (!cartRows || cartRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A kosarad üres, nem lehet rendelést leadni.",
      });
    }

    let totalPrice = 0;
    cartRows.forEach((row) => {
      const lineTotal = Number(row.price) * Number(row.quantity);
      totalPrice += lineTotal;
    });

    const orderInsertSql = `
      INSERT INTO orders 
        (user_id, total_price, status, shipping_name, shipping_phone, shipping_address, payment_method, note)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
    `;

    db.query(
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
      (err2, result) => {
        if (err2) {
          console.error("DB hiba (order insert):", err2);
          return res.status(500).json({
            success: false,
            message: "Szerver hiba a rendelés mentésekor.",
          });
        }

        const orderId = result.insertId;

        const orderItemsValues = cartRows.map((row) => [
          orderId,
          row.product_id,
          row.quantity,
          row.price,
        ]);

        const orderItemsSql = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES ?
        `;

        db.query(orderItemsSql, [orderItemsValues], (err3) => {
          if (err3) {
            console.error("DB hiba (order_items insert):", err3);
            return res.status(500).json({
              success: false,
              message: "Szerver hiba a rendelés tételeinek mentésekor.",
            });
          }

          const clearCartSql = "DELETE FROM cart_items WHERE user_id = ?";

          db.query(clearCartSql, [userId], (err4) => {
            if (err4) {
              console.error("DB hiba (kosár törlése):", err4);
              return res.status(200).json({
                success: true,
                message:
                  "Rendelésedet fogadtuk, de nem sikerült a kosarat kiüríteni. Kérlek frissítsd az oldalt.",
                orderId,
              });
            }

            return res.json({
              success: true,
              message: "Rendelésedet fogadtuk, köszönjük!",
              orderId,
            });
          });
        });
      }
    );
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
      p.name AS product_name
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
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

      ordersMap[id].items.push({
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        unit_price: Number(row.unit_price),
      });
    });

    const orders = Object.values(ordersMap);

    return res.json({
      success: true,
      orders,
    });
  });
}
