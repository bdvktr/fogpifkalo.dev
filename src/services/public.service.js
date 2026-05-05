import { db } from "../repositories/db.repository.js";
import {
  parseIngredients,
  toIngredientsJson,
} from "../config/parseIngredients.js";

export function getProducts(req, res) {
  const sql = `
  SELECT id, name, description, ingredients, price, image_url, category, is_active, menu_extra_type
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

    rows.forEach((p) => {
      p.ingredients = parseIngredients(p.ingredients);
    });

    return res.json({
      success: true,
      products: rows,
    });
  });
}

export function getMenu(req, res) {
  const sql = `
  SELECT id, name, description, ingredients, price, image_url, category, menu_extra_type
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

    rows.forEach((p) => {
      p.ingredients = parseIngredients(p.ingredients);
    });

    return res.json({
      success: true,
      products: rows,
    });
  });
}

export function getSpecialOffers(req, res) {
  const sql = `
  SELECT id, name, description, ingredients, price, image_url, category
  FROM products
  WHERE is_active = 1
    AND is_special_offer = 1
  ORDER BY category, name
`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/special-offers):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a hétvégi ajánlatok lekérdezésekor.",
      });
    }

    rows.forEach((p) => {
      p.ingredients = parseIngredients(p.ingredients);
    });

    return res.json({
      success: true,
      products: rows,
    });
  });
}

export function getToppings(req, res) {
  const sql = `
  SELECT id, name, price, image_url, is_active, sort_order
  FROM toppings
  WHERE is_active = 1
  ORDER BY sort_order ASC, name ASC
`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/toppings):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a feltétek lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      toppings: rows,
    });
  });
}


export function getDeliveryZones(req, res) {
  const sql = `
    SELECT city, delivery_fee
    FROM delivery_zones
    WHERE is_active = 1
    ORDER BY sort_order ASC, city ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (/api/delivery-zones):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a szállítási díjak lekérdezésekor.",
      });
    }

    return res.json({
      success: true,
      zones: (rows || []).map((row) => ({
        city: row.city,
        delivery_fee: Number(row.delivery_fee || 0),
      })),
    });
  });
}

