import { db } from "../repositories/db.repository.js";

export function getCart(req, res) {
  const userId = req.user.id;

  const sql = `
    SELECT 
      ci.id,
      ci.product_id,
      ci.quantity,
      p.name,
      p.price,
      (ci.quantity * p.price) AS line_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (cart select):", err);
      return res
        .status(500)
        .json({ success: false, message: "Szerver hiba (kosár lekérdezés)." });
    }

    const items = rows;
    const total = items.reduce((sum, item) => sum + Number(item.line_total), 0);

    return res.json({
      success: true,
      items,
      total,
    });
  });
}

export function addToCart(req, res) {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  const qty = Number(quantity) || 1;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "productId megadása kötelező." });
  }

  if (qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "A mennyiségnek pozitívnak kell lennie.",
    });
  }

  const sql = `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;

  db.query(sql, [userId, productId, qty], (err, result) => {
    if (err) {
      console.error("DB hiba (cart add):", err);
      return res
        .status(500)
        .json({ success: false, message: "Szerver hiba (kosárhoz adás)." });
    }

    return res.json({
      success: true,
      message: "Termék hozzáadva a kosárhoz.",
    });
  });
}

export function clearCart(req, res) {
  const userId = req.user.id;

  const sql = "DELETE FROM cart_items WHERE user_id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("DB hiba (cart clear):", err);
      return res
        .status(500)
        .json({ success: false, message: "Szerver hiba (kosár ürítés)." });
    }

    return res.json({
      success: true,
      message: "Kosár ürítve.",
    });
  });
}

export function removeItem(req, res) {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "productId megadása kötelező." });
  }

  const sql = "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";

  db.query(sql, [userId, productId], (err, result) => {
    if (err) {
      console.error("DB hiba (cart remove):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (kosár tétel törlése).",
      });
    }

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Ez a tétel nem található a kosárban.",
      });
    }

    return res.json({
      success: true,
      message: "Tétel törölve a kosárból.",
    });
  });
}
