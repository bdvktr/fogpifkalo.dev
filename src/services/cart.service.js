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

function normalizeToppingIds(rawToppings) {
  if (!Array.isArray(rawToppings)) {
    return [];
  }

  const normalized = rawToppings
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set(normalized)].sort((a, b) => a - b);
}

function buildConfigKey(config) {
  if (!config) {
    return "base";
  }

  const normalizedToppings = normalizeToppingIds(config.toppings);
  const toppingsPart =
    normalizedToppings.length > 0 ? normalizedToppings.join("-") : "0";

  if (config.baseType === "single") {
    if (toppingsPart === "0") {
      return "base";
    }

    return `single|${toppingsPart}`;
  }

  if (config.baseType !== "menu") {
    return "base";
  }

  const sideProductId = Number(config.sideProductId || 0);
  const extraType = config.extraType || "none";
  const sauceId = extraType === "sauce" ? Number(config.sauceId || 0) : 0;

  return `menu|${sideProductId}|${extraType}|${sauceId}|${toppingsPart}`;
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
  const toppings = normalizeToppingIds(rawConfig.toppings);

  if (baseType === "single") {
    const config =
      toppings.length > 0
        ? {
            baseType: "single",
            toppings,
          }
        : null;

    return {
      success: true,
      config,
      configKey: buildConfigKey(config),
    };
  }

  const sideProductId = Number(rawConfig.sideProductId);
  const extraType = rawConfig.extraType;

  if (!Number.isInteger(sideProductId) || sideProductId <= 0) {
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
    sideProductId,
    extraType,
    sauceId,
    toppings,
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
      side_p.name AS side_name,
      (ci.quantity * p.price) AS line_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN products s
      ON s.id = CAST(
        JSON_UNQUOTE(JSON_EXTRACT(ci.config_json, '$.sauceId')) AS UNSIGNED
      )
    LEFT JOIN products side_p
      ON side_p.id = CAST(
        JSON_UNQUOTE(JSON_EXTRACT(ci.config_json, '$.sideProductId')) AS UNSIGNED
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

      if (config && row.side_name) {
        config.sideName = row.side_name;
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

    const toppingIds = [
      ...new Set(
        items.flatMap((item) =>
          Array.isArray(item.config?.toppings)
            ? item.config.toppings
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value > 0)
            : [],
        ),
      ),
    ];

    const total = items.reduce((sum, item) => sum + Number(item.line_total), 0);

    if (toppingIds.length === 0) {
      return res.json({
        success: true,
        items,
        total,
      });
    }

    const toppingsSql = `
      SELECT id, name
      FROM toppings
      WHERE is_active = 1
        AND id IN (?)
      ORDER BY sort_order ASC, name ASC
    `;

    db.query(toppingsSql, [toppingIds], (toppingErr, toppingRows) => {
      if (toppingErr) {
        console.error("DB hiba (cart toppings select):", toppingErr);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (kosár feltétek lekérdezése).",
        });
      }

      const toppingNameMap = new Map(
        (toppingRows || []).map((row) => [Number(row.id), row.name]),
      );

      items.forEach((item) => {
        if (!item.config || !Array.isArray(item.config.toppings)) {
          return;
        }

        item.config.toppingNames = item.config.toppings
          .map((id) => toppingNameMap.get(Number(id)))
          .filter(Boolean);
      });

      return res.json({
        success: true,
        items,
        total,
      });
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

    const toppingIds = Array.isArray(configResult.config?.toppings)
      ? configResult.config.toppings
      : [];

    function validateToppingsAndInsert() {
      if (toppingIds.length === 0) {
        return insertCartItem({
          res,
          userId,
          productId: normalizedProductId,
          qty,
          config: configResult.config,
          configKey: configResult.configKey,
        });
      }

      const toppingsSql = `
    SELECT id, is_active
    FROM toppings
    WHERE id IN (?)
  `;

      db.query(toppingsSql, [toppingIds], (toppingErr, toppingRows) => {
        if (toppingErr) {
          console.error("DB hiba (cart add toppings check):", toppingErr);
          return res.status(500).json({
            success: false,
            message: "Szerver hiba a feltétek ellenőrzésekor.",
          });
        }

        if (!toppingRows || toppingRows.length !== toppingIds.length) {
          return res.status(400).json({
            success: false,
            message:
              "A kiválasztott extra feltétek között érvénytelen elem található.",
          });
        }

        const hasInactive = toppingRows.some(
          (row) => Number(row.is_active) !== 1,
        );

        if (hasInactive) {
          return res.status(400).json({
            success: false,
            message:
              "A kiválasztott extra feltétek között nem elérhető elem található.",
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
      });
    }

    function validateSideAndContinue() {
      if (configResult.config?.baseType !== "menu") {
        return validateToppingsAndInsert();
      }

      const sideSql = `
    SELECT id, is_active, category
    FROM products
    WHERE id = ?
    LIMIT 1
  `;

      db.query(
        sideSql,
        [configResult.config.sideProductId],
        (sideErr, sideRows) => {
          if (sideErr) {
            console.error("DB hiba (cart add side check):", sideErr);
            return res.status(500).json({
              success: false,
              message: "Szerver hiba (köret ellenőrzése).",
            });
          }

          if (!sideRows || sideRows.length === 0) {
            return res.status(400).json({
              success: false,
              message: "A kiválasztott köret nem található.",
            });
          }

          const side = sideRows[0];

          if (Number(side.is_active) !== 1 || side.category !== "side") {
            return res.status(400).json({
              success: false,
              message: "A kiválasztott köret nem választható.",
            });
          }

          return validateToppingsAndInsert();
        },
      );
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

          return validateSideAndContinue();
        },
      );

      return;
    }

    return validateSideAndContinue();
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
