import { db } from "../repositories/db.repository.js";

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

function buildConfigKey(config) {
  if (!config || config.baseType !== "menu") {
    return "base";
  }

  const sideType = config.sideType || "none";
  const extraType = config.extraType || "none";
  const sauceId = extraType === "sauce" ? Number(config.sauceId || 0) : 0;

  return `menu|${sideType}|${extraType}|${sauceId}`;
}

function normalizeCartConfig(rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object") {
    return {
      success: true,
      config: null,
      configKey: "base",
    };
  }

  const baseType = rawConfig.baseType === "menu" ? "menu" : "single";

  if (baseType !== "menu") {
    return {
      success: true,
      config: null,
      configKey: "base",
    };
  }

  const sideType = rawConfig.sideType;
  const extraType = rawConfig.extraType;

  if (sideType !== "crispers" && sideType !== "sweet_potato") {
    return {
      success: false,
      message: "Érvénytelen menü köret választás.",
    };
  }

  if (extraType !== "coleslaw" && extraType !== "sauce") {
    return {
      success: false,
      message: "Érvénytelen menü kiegészítő választás.",
    };
  }

  let sauceId = null;

  if (extraType === "sauce") {
    const normalizedSauceId = Number(rawConfig.sauceId);

    if (!Number.isInteger(normalizedSauceId) || normalizedSauceId <= 0) {
      return {
        success: false,
        message: "A menühöz kiválasztott szósz érvénytelen.",
      };
    }

    sauceId = normalizedSauceId;
  }

  const config = {
    baseType: "menu",
    sideType,
    extraType,
    sauceId,
  };

  return {
    success: true,
    config,
    configKey: buildConfigKey(config),
  };
}

function insertCartItem({ res, userId, productId, qty, config, configKey }) {
  const sql = `
    INSERT INTO cart_items (user_id, product_id, quantity, config_json, config_key)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;

  const configJson = config ? JSON.stringify(config) : null;

  db.query(sql, [userId, productId, qty, configJson, configKey], (err) => {
    if (err) {
      console.error("DB hiba (cart add):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (kosárhoz adás).",
      });
    }

    return res.json({
      success: true,
      message: "Termék hozzáadva a kosárhoz.",
    });
  });
}

export function getCart(req, res) {
  const userId = req.user.id;

  const sql = `
    SELECT 
      ci.id,
      ci.product_id,
      ci.quantity,
      ci.config_json,
      ci.config_key,
      p.name,
      p.price,
      s.name AS sauce_name,
      (ci.quantity * p.price) AS line_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN products s
      ON s.id = CAST(
        JSON_UNQUOTE(JSON_EXTRACT(ci.config_json, '$.sauceId')) AS UNSIGNED
      )
    WHERE ci.user_id = ?
    ORDER BY ci.id ASC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (cart select):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (kosár lekérdezés).",
      });
    }

    const items = (rows || []).map((row) => {
      const config = parseConfigJson(row.config_json);

      if (config && row.sauce_name) {
        config.sauceName = row.sauce_name;
      }

      return {
        id: row.id,
        product_id: row.product_id,
        quantity: row.quantity,
        config_key: row.config_key || "base",
        config,
        name: row.name,
        price: Number(row.price),
        line_total: Number(row.line_total),
      };
    });

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
  const { productId, quantity, config } = req.body;

  const normalizedProductId = Number(productId);
  const qty = Number(quantity) || 1;

  if (!normalizedProductId) {
    return res.status(400).json({
      success: false,
      message: "productId megadása kötelező.",
    });
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "A mennyiségnek pozitív egész számnak kell lennie.",
    });
  }

  const productSql = `
    SELECT id, is_active, category
    FROM products
    WHERE id = ?
    LIMIT 1
  `;

  db.query(productSql, [normalizedProductId], (productErr, productRows) => {
    if (productErr) {
      console.error("DB hiba (cart add product check):", productErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (termék ellenőrzése).",
      });
    }

    if (!productRows || productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "A kiválasztott termék nem található.",
      });
    }

    const product = productRows[0];

    if (Number(product.is_active) !== 1) {
      return res.status(400).json({
        success: false,
        message: "Az inaktív termék nem adható a kosárhoz.",
      });
    }

    if (product.category !== "burger") {
      return insertCartItem({
        res,
        userId,
        productId: normalizedProductId,
        qty,
        config: null,
        configKey: "base",
      });
    }

    const configResult = normalizeCartConfig(config);

    if (!configResult.success) {
      return res.status(400).json({
        success: false,
        message: configResult.message,
      });
    }

    if (configResult.config && configResult.config.extraType === "sauce") {
      const sauceSql = `
        SELECT id, is_active, category
        FROM products
        WHERE id = ?
        LIMIT 1
      `;

      db.query(
        sauceSql,
        [configResult.config.sauceId],
        (sauceErr, sauceRows) => {
          if (sauceErr) {
            console.error("DB hiba (cart add sauce check):", sauceErr);
            return res.status(500).json({
              success: false,
              message: "Szerver hiba (szósz ellenőrzése).",
            });
          }

          if (!sauceRows || sauceRows.length === 0) {
            return res.status(400).json({
              success: false,
              message: "A kiválasztott szósz nem található.",
            });
          }

          const sauce = sauceRows[0];

          if (Number(sauce.is_active) !== 1 || sauce.category !== "sauce") {
            return res.status(400).json({
              success: false,
              message: "A kiválasztott szósz nem választható.",
            });
          }

          return insertCartItem({
            res,
            userId,
            productId: normalizedProductId,
            qty,
            config: configResult.config,
            configKey: configResult.configKey,
          });
        },
      );

      return;
    }

    return insertCartItem({
      res,
      userId,
      productId: normalizedProductId,
      qty,
      config: configResult.config,
      configKey: configResult.configKey,
    });
  });
}

export function clearCart(req, res) {
  const userId = req.user.id;

  const sql = "DELETE FROM cart_items WHERE user_id = ?";

  db.query(sql, [userId], (err) => {
    if (err) {
      console.error("DB hiba (cart clear):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (kosár ürítés).",
      });
    }

    return res.json({
      success: true,
      message: "Kosár ürítve.",
    });
  });
}

export function removeItem(req, res) {
  const userId = req.user.id;
  const cartItemId = Number(req.body?.cartItemId);
  const productId = Number(req.body?.productId);

  if (Number.isInteger(cartItemId) && cartItemId > 0) {
    const sql = "DELETE FROM cart_items WHERE user_id = ? AND id = ?";

    db.query(sql, [userId, cartItemId], (err, result) => {
      if (err) {
        console.error("DB hiba (cart remove by id):", err);
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

    return;
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "cartItemId vagy productId megadása kötelező.",
    });
  }

  const fallbackSql =
    "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";

  db.query(fallbackSql, [userId, productId], (err, result) => {
    if (err) {
      console.error("DB hiba (cart remove by product):", err);
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
