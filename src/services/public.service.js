import { db } from "../repositories/db.repository.js";

export function getProducts(req, res) {
  const sql = `
    SELECT id, name, description, price, image_url 
    FROM products
    WHERE is_active = 1
    ORDER BY id ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/products):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (termékek lekérdezése).",
      });
    }

    return res.json({
      success: true,
      products: rows,
    });
  });
}

export function getMenu(req, res) {
  const sql = `
    SELECT id, name, description, price, category
    FROM products
    WHERE is_active = 1
    ORDER BY category, name
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/menu):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a menü lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      products: rows,
    });
  });
}
