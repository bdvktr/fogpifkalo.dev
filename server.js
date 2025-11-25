import express, { json, urlencoded } from "express";
import { createPool } from "mysql2";
import { hash as _hash, compare } from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 10;

const app = express();

// Statikus fájlok (frontend) kiszolgálása
app.use(express.static(path.join(__dirname, "public")));

// JSON body-k fogadása (pl. fetch POST)
app.use(json());

// HTML <form> POST-ok fogadása (application/x-www-form-urlencoded)
app.use(urlencoded({ extended: true }));

// 🔹 Session beállítás
app.use(
  session({
    secret: "nagyon-titkos-jelszo-csereld-ki", // fejlesztéshez jó, élesben legyen erősebb, .env-ből
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // secure: true, // csak HTTPS-en – fejlesztésnél HTTP-n vagyunk, ezért most ne használd
      maxAge: 1000 * 60 * 60 * 24, // 1 nap
    },
  })
);

// 🔹 Middleware: csak bejelentkezett usernek engedünk tovább
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Ehhez a művelethez be kell jelentkezni.",
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Nincs jogosultság (admin szükséges).",
    });
  }
  next();
}

// 🔹 MySQL kapcsolat (MAMP beállításokkal)
const db = createPool({
  host: "localhost",
  port: 3306, // MAMP MySQL port (általában 8889)
  user: "root",
  password: "root",
  database: "fogpifkalo",
});

// 🔹 Egyszerű teszt endpoint – ellenőrzi, hogy él-e a szerver
app.get("/api/ping", (req, res) => {
  res.json({ message: "BurgerBázis backend él 🚀" });
});

// 🔹 DB teszt endpoint – lefuttat egy egyszerű lekérdezést
app.get("/api/db-test", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, rows) => {
    if (err) {
      console.error("DB hiba:", err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    res.json({ db_ok: true, result: rows[0].result });
  });
});

// 🔹 Regisztráció endpoint
app.post("/api/register", async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: "Minden mező kitöltése kötelező.",
    });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: "A két jelszó nem egyezik.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "A jelszónak legalább 8 karakter hosszúnak kell lennie.",
    });
  }

  // Ellenőrizzük, hogy van-e már ilyen email
  const checkSql = "SELECT id FROM users WHERE email = ? LIMIT 1";
  db.query(checkSql, [email], async (err, rows) => {
    if (err) {
      console.error("DB hiba (email ellenőrzés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (email ellenőrzése).",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ezzel az e-mail címmel már létezik fiók.",
      });
    }

    // Jelszó hash-elése
    const passwordHash = await bcrypt.hash(password, 10);

    const insertSql =
      "INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 0)";

    db.query(insertSql, [name, email, passwordHash], (err2, result) => {
      if (err2) {
        console.error("DB hiba (regisztráció):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (regisztráció).",
        });
      }

      const newUserId = result.insertId;

      // 🔹 KÖZVETLEN BELÉPTETÉS – session beállítása
      req.session.user = {
        id: newUserId,
        name,
        email,
        isAdmin: false,
      };

      return res.json({
        success: true,
        message: "Sikeres regisztráció.",
        user: {
          id: newUserId,
          name,
          email,
          isAdmin: false,
        },
      });
    });
  });
});

// 🔹 Bejelentkezés endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // 1) Alap ellenőrzés
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "E-mail és jelszó megadása kötelező." });
  }

  // 2) User keresése az adatbázisban
  const sql =
    "SELECT id, name, email, password_hash, is_admin FROM users WHERE email = ? LIMIT 1";

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error("DB hiba (login select):", err);
      return res
        .status(500)
        .json({ success: false, message: "Szerver hiba (login lekérdezés)." });
    }

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Hibás e-mail vagy jelszó." });
    }

    const user = rows[0];

    // 3) Jelszó összehasonlítása a hash-sel
    compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        console.error("bcrypt hiba (compare):", err);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó ellenőrzés).",
        });
      }

      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Hibás e-mail vagy jelszó." });
      }

      // 4) Sikeres bejelentkezés → user elmentése a sessionbe
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: !!user.is_admin,
      };

      return res.json({
        success: true,
        message: "Sikeres bejelentkezés.",
        user: req.session.user,
      });
    });
  });
});

// 🔹 Jelenlegi bejelentkezett felhasználó lekérdezése
app.get("/api/me", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ loggedIn: false, user: null });
  }

  return res.json({
    loggedIn: true,
    user: {
      id: req.session.user.id,
      name: req.session.user.name,
      email: req.session.user.email,
      isAdmin: !!req.session.user.isAdmin,
    },
  });
});

// 🔹 Profil adatainak frissítése (név, email)
app.put("/api/account", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "A név és az e-mail megadása kötelező.",
    });
  }

  // Ellenőrizzük, hogy az email nincs-e már másnál
  const checkSql = "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1";

  db.query(checkSql, [email, userId], (err, rows) => {
    if (err) {
      console.error("DB hiba (email ellenőrzés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (email ellenőrzés).",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ezzel az e-mail címmel már létezik fiók.",
      });
    }

    const updateSql = "UPDATE users SET name = ?, email = ? WHERE id = ?";

    db.query(updateSql, [name, email, userId], (err2) => {
      if (err2) {
        console.error("DB hiba (profil frissítés):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (profil frissítése).",
        });
      }

      // session-ben is frissítjük
      req.session.user.name = name;
      req.session.user.email = email;

      return res.json({
        success: true,
        message: "Profil sikeresen frissítve.",
        user: {
          id: userId,
          name,
          email,
          isAdmin: req.session.user.isAdmin || false,
        },
      });
    });
  });
});

// 🔹 Jelszó módosítása
app.put("/api/account/password", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "A régi és az új jelszó megadása kötelező.",
    });
  }

  // minimális jelszó ellenőrzés
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Az új jelszónak legalább 8 karakter hosszúnak kell lennie.",
    });
  }

  const sql = "SELECT password_hash FROM users WHERE id = ? LIMIT 1";

  db.query(sql, [userId], async (err, rows) => {
    if (err) {
      console.error("DB hiba (jelszó lekérdezés):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (jelszó lekérdezése).",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Felhasználó nem található.",
      });
    }

    const storedHash = rows[0].password_hash;

    const match = await bcrypt.compare(currentPassword, storedHash);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "A jelenlegi jelszó nem helyes.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const updateSql = "UPDATE users SET password_hash = ? WHERE id = ?";

    db.query(updateSql, [newHash, userId], (err2) => {
      if (err2) {
        console.error("DB hiba (jelszó frissítés):", err2);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (jelszó frissítése).",
        });
      }

      return res.json({
        success: true,
        message: "Jelszó sikeresen frissítve.",
      });
    });
  });
});

// 🔹 Kosár lekérdezése
app.get("/api/cart", requireLogin, (req, res) => {
  const userId = req.session.user.id;

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
});

// 🔹 Tétel hozzáadása a kosárhoz
app.post("/api/cart/add", requireLogin, (req, res) => {
  const userId = req.session.user.id;
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
});

// 🔹 Kosár ürítése
app.post("/api/cart/clear", requireLogin, (req, res) => {
  const userId = req.session.user.id;

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
});

// 🔹 Egy tétel törlése a kosárból
app.post("/api/cart/remove", requireLogin, (req, res) => {
  const userId = req.session.user.id;
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
});

// Rendelés véglegesítése (checkout)
app.post("/api/checkout", requireLogin, (req, res) => {
  const userId = req.session.user.id;

  const { shippingName, shippingPhone, shippingAddress, paymentMethod, note } =
    req.body || {};

  // 1) Szállítási adatok ellenőrzése
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

  // 2) Kosár lekérése
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

    // 3) Összeg számítása
    let totalPrice = 0;
    cartRows.forEach((row) => {
      const lineTotal = Number(row.price) * Number(row.quantity);
      totalPrice += lineTotal;
    });

    // 4) Rendelés rögzítése az orders táblába
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

        // 5) Rendelés tételeinek rögzítése az order_items táblába
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

          // 6) Kosár kiürítése
          const clearCartSql = "DELETE FROM cart_items WHERE user_id = ?";

          db.query(clearCartSql, [userId], (err4) => {
            if (err4) {
              console.error("DB hiba (kosár törlése):", err4);
              // a rendelés már létrejött, szóval itt nem 500-at dobunk, csak jelezzük
              return res.status(200).json({
                success: true,
                message:
                  "Rendelésedet fogadtuk, de nem sikerült a kosarat kiüríteni. Kérlek frissítsd az oldalt.",
                orderId,
              });
            }

            // 7) Sikeres checkout válasz
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
});

// 🔹 Rendelések lekérdezése a bejelentkezett felhasználónak
app.get("/api/orders", requireLogin, (req, res) => {
  const userId = req.session.user.id;

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

    // Sorok csoportosítása rendelésenként
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
});

// 🔹 Admin – termékek listázása
app.get("/api/admin/products", requireAdmin, (req, res) => {
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
});

// 🔹 Admin – új termék létrehozása
app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { name, description, price, is_active, category } = req.body;

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

  const sql = `
    INSERT INTO products (name, description, price, image_url, category)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, description || null, price, is_active ? 1 : 0, safeCategory],
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
});

// 🔹 Admin – termék módosítása
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, image_url, category, is_active } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "A név és az ár megadása kötelező.",
    });
  }

  // kategória normalizálás (ha hülyeség jön, legyen burger)
  const safeCategory =
    category === "burger" ||
    category === "side" ||
    category === "drink" ||
    category === "sauce"
      ? category
      : "burger";

  // is_active normalizálás (boolean / 0 / 1 → 0 vagy 1)
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
});

// 🔹 Admin – termék inaktiválása
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
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
});

// 🔹 Admin – termék újraaktiválása
app.put("/api/admin/products/:id/activate", requireAdmin, (req, res) => {
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
});

// 🔹 Admin – rendelések listázása
app.get("/api/admin/orders", requireAdmin, (req, res) => {
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
});

// 🔹 Admin – egy rendelés részletei
app.get("/api/admin/orders/:id", requireAdmin, (req, res) => {
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
});

// 🔹 Admin – rendelés státuszának módosítása
app.put("/api/admin/orders/:id/status", requireAdmin, (req, res) => {
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

  // status oszlop backtickkel
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

    return res.json({
      success: true,
      message: "Rendelés státusza frissítve.",
    });
  });
});

// 🔹 Admin – asztalfoglalások listázása
app.get("/api/admin/reservations", requireAdmin, (req, res) => {
  const sql = `
    SELECT
      id,
      table_number,
      reservation_date,
      reservation_time,
      end_time,
      name,
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
});

// 🔹 Admin – foglalás státuszának módosítása
app.put("/api/admin/reservations/:id/status", requireAdmin, (req, res) => {
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

    return res.json({
      success: true,
      message: "Foglalás státusza frissítve.",
    });
  });
});

// 🔹 Publikus – termékek listázása a menühöz
app.get("/api/products", (req, res) => {
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
});

// Teljes menü lekérése kategória szerint
app.get("/api/menu", (req, res) => {
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
});

// 🔹 Asztalfoglalás (vendég) – tetszőleges idősáv: mettől–meddig
app.post("/api/reservations", (req, res) => {
  const {
    tableNumber,
    date, // "YYYY-MM-DD"
    timeFrom, // "HH:MM"
    timeTo, // "HH:MM"
    name,
    phone,
    peopleCount,
    note,
  } = req.body || {};

  // 1) Alap ellenőrzés – kötelező mezők
  if (
    !tableNumber ||
    !date ||
    !timeFrom ||
    !timeTo ||
    !name ||
    !phone ||
    !peopleCount
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Minden mező kitöltése kötelező (asztal, dátum, mettől, meddig, név, telefon, létszám).",
    });
  }

  const tableNum = Number(tableNumber);
  const ppl = Number(peopleCount);

  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 6) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen asztalszám. 1 és 6 között választható.",
    });
  }

  if (!Number.isInteger(ppl) || ppl <= 0 || ppl > 12) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen létszám. 1 és 12 fő között foglalhatsz.",
    });
  }

  // 2) Formátum ellenőrzés
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  const timeRegex = /^\d{2}:\d{2}$/; // HH:MM

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      message:
        "Érvénytelen dátum formátum. Használd: ÉÉÉÉ-HH-NN (pl. 2025-11-21).",
    });
  }

  if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen időpont formátum. Használd: ÓÓ:PP (pl. 18:30).",
    });
  }

  const [yearStr, monthStr, dayStr] = date.split("-");
  const [fromHourStr, fromMinStr] = timeFrom.split(":");
  const [toHourStr, toMinStr] = timeTo.split(":");

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const fromHour = Number(fromHourStr);
  const fromMin = Number(fromMinStr);
  const toHour = Number(toHourStr);
  const toMin = Number(toMinStr);

  const startDt = new Date(year, month - 1, day, fromHour, fromMin, 0, 0);
  const endDt = new Date(year, month - 1, day, toHour, toMin, 0, 0);

  const isValidStart =
    startDt.getFullYear() === year &&
    startDt.getMonth() === month - 1 &&
    startDt.getDate() === day &&
    startDt.getHours() === fromHour &&
    startDt.getMinutes() === fromMin;

  const isValidEnd =
    endDt.getFullYear() === year &&
    endDt.getMonth() === month - 1 &&
    endDt.getDate() === day &&
    endDt.getHours() === toHour &&
    endDt.getMinutes() === toMin;

  if (
    !isValidStart ||
    !isValidEnd ||
    isNaN(startDt.getTime()) ||
    isNaN(endDt.getTime())
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Érvénytelen dátum vagy időpont. Kérlek ellenőrizd a megadott értékeket.",
    });
  }

  // meddig > mettől
  if (endDt.getTime() <= startDt.getTime()) {
    return res.status(400).json({
      success: false,
      message: "A foglalás vége legyen később, mint a kezdete.",
    });
  }

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const reservationDay = new Date(year, month - 1, day);

  // múltbeli nap tiltása
  if (reservationDay < today) {
    return res.status(400).json({
      success: false,
      message:
        "Már elmúlt napra nem tudsz foglalni. Kérlek válassz egy későbbi dátumot.",
    });
  }

  // ha ma van → a kezdés legyen jövőbeni
  const isToday =
    reservationDay.getFullYear() === today.getFullYear() &&
    reservationDay.getMonth() === today.getMonth() &&
    reservationDay.getDate() === today.getDate();

  if (isToday && startDt.getTime() <= now.getTime()) {
    return res.status(400).json({
      success: false,
      message:
        "Erre az időpontra már nem tudsz foglalni. Válassz későbbi időpontot a mai napra.",
    });
  }

  const mysqlStart = `${timeFrom}:00`; // "HH:MM:SS"
  const mysqlEnd = `${timeTo}:00`;

  const newStartMs = startDt.getTime();
  const newEndMs = endDt.getTime();

  // 3) Ütközésvizsgálat: ugyanazon a napon, ugyanazon az asztalon lévő sávokkal
  const conflictSql = `
    SELECT id, reservation_date, reservation_time, end_time
    FROM reservations
    WHERE table_number = ?
      AND reservation_date = ?
      AND status IN ('pending', 'confirmed')
  `;

  db.query(conflictSql, [tableNum, date], (conflictErr, conflictRows) => {
    if (conflictErr) {
      console.error("DB hiba (reservation conflict check):", conflictErr);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba a foglalás ellenőrzésekor.",
      });
    }

    const hasOverlap = conflictRows.some((r) => {
      let datePart = "";
      let timePartFrom = "";
      let timePartTo = "";

      if (typeof r.reservation_date === "string") {
        datePart = r.reservation_date.split("T")[0];
      } else if (r.reservation_date instanceof Date) {
        datePart = r.reservation_date.toISOString().split("T")[0];
      }

      if (typeof r.reservation_time === "string") {
        timePartFrom = r.reservation_time.slice(0, 5);
      } else if (r.reservation_time instanceof Date) {
        timePartFrom = r.reservation_time.toTimeString().slice(0, 5);
      }

      if (r.end_time) {
        if (typeof r.end_time === "string") {
          timePartTo = r.end_time.slice(0, 5);
        } else if (r.end_time instanceof Date) {
          timePartTo = r.end_time.toTimeString().slice(0, 5);
        }
      } else {
        // régi foglalások: ha nincs end_time, vegyük 2 órásnak
        const tmpStart = new Date(`${datePart}T${timePartFrom}:00`);
        const tmpEndMs = tmpStart.getTime() + 120 * 60 * 1000;
        const tmpEnd = new Date(tmpEndMs);
        timePartTo = tmpEnd.toTimeString().slice(0, 5);
      }

      const existingStart = new Date(`${datePart}T${timePartFrom}:00`);
      const existingEnd = new Date(`${datePart}T${timePartTo}:00`);

      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) {
        return false;
      }

      const existingStartMs = existingStart.getTime();
      const existingEndMs = existingEnd.getTime();

      // nincs ütközés, ha egyik teljesen a másik előtt/után:
      // existingEnd <= newStart  VAGY  existingStart >= newEnd
      const noOverlap =
        existingEndMs <= newStartMs || existingStartMs >= newEndMs;

      return !noOverlap;
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message:
          "Erre az idősávra ezen az asztalon már van foglalás. Kérlek válassz másik időpontot vagy asztalt.",
      });
    }

    // 4) Nincs ütközés → beszúrjuk a foglalást
    const insertSql = `
      INSERT INTO reservations
        (table_number, reservation_date, reservation_time, end_time, name, phone, people_count, note, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.query(
      insertSql,
      [tableNum, date, mysqlStart, mysqlEnd, name, phone, ppl, note || null],
      (err2, result) => {
        if (err2) {
          console.error("DB hiba (reservation insert):", err2);
          return res.status(500).json({
            success: false,
            message: "Szerver hiba a foglalás mentésekor.",
          });
        }

        return res.json({
          success: true,
          message:
            "Foglalásod rögzítettük, hamarosan visszaigazoljuk. Köszönjük!",
          reservationId: result.insertId,
        });
      }
    );
  });
});

// 🔹 Kilépés
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session törlés hiba:", err);
      return res
        .status(500)
        .json({ success: false, message: "Nem sikerült kilépni." });
    }

    // opcionálisan: törölhetjük a cookie-t is
    res.clearCookie("connect.sid"); // express-session default cookie neve

    return res.json({ success: true, message: "Sikeres kilépés." });
  });
});

// 🔹 Szerver indítása
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BurgerBázis backend fut: http://localhost:${PORT}`);
});
