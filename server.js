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

  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    paymentMethod,
    note,
  } = req.body || {};

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
  const sql =
    "SELECT id, name, description, price, image_url FROM products ORDER BY id ASC";

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("DB hiba (admin products select):", err);
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

// 🔹 Admin – új termék létrehozása
app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { name, description, price, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "A név és az ár megadása kötelező.",
    });
  }

  const sql = `
    INSERT INTO products (name, description, price, image_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, description || "", price, image_url || ""],
    (err, result) => {
      if (err) {
        console.error("DB hiba (admin products insert):", err);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (termék létrehozása).",
        });
      }

      return res.json({
        success: true,
        message: "Termék létrehozva.",
        productId: result.insertId,
      });
    }
  );
});

// 🔹 Admin – termék módosítása
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, image_url } = req.body;

  const sql = `
    UPDATE products
    SET name = ?, description = ?, price = ?, image_url = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, description || "", price, image_url || "", productId],
    (err, result) => {
      if (err) {
        console.error("DB hiba (admin products update):", err);
        return res.status(500).json({
          success: false,
          message: "Szerver hiba (termék módosítása).",
        });
      }

      return res.json({
        success: true,
        message: "Termék frissítve.",
      });
    }
  );
});

// 🔹 Admin – termék törlése
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const productId = req.params.id;

  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error("DB hiba (admin products delete):", err);
      return res.status(500).json({
        success: false,
        message: "Szerver hiba (termék törlése).",
      });
    }

    return res.json({
      success: true,
      message: "Termék törölve.",
    });
  });
});

// 🔹 Admin – termék módosítása
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "A név és az ár megadása kötelező.",
    });
  }

  const sql = `
    UPDATE products
    SET name = ?, description = ?, price = ?, image_url = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, description || "", price, image_url || "", productId],
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

// 🔹 Publikus – termékek listázása a menühöz
app.get("/api/products", (req, res) => {
  const sql =
    "SELECT id, name, description, price, image_url FROM products ORDER BY id ASC";

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
