document.addEventListener("DOMContentLoaded", () => {
  const burgerList = document.getElementById("burgerList");
  const sideList = document.getElementById("sideList");
  const drinkList = document.getElementById("drinkList");
  const sauceList = document.getElementById("sauceList");

  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function createProductCard(product) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    const fallbackImg = "images/farmburger.png";
    let imgSrc = product.image_url || product.imageUrl || product.image || "";

    if (imgSrc && !imgSrc.startsWith("http") && !imgSrc.startsWith("/")) {
      imgSrc = "/" + imgSrc.replace(/^\/+/, "");
    }
    if (!imgSrc) imgSrc = fallbackImg;

    col.innerHTML = `
      <div
        class="menu-image-card"
        role="button"
        tabindex="0"
        data-product-id="${escapeAttr(product.id)}"
      >
        <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(product.name || "Termék")}">

        <div class="menu-image-overlay">
          <h5 class="product-title">${escapeHtml(product.name || "")}</h5>

          <p class="product-desc">
            ${escapeHtml(product.description || " ")}
          </p>

          <div class="overlay-bottom">
            <div class="product-price">${formatFt(product.price)} Ft</div>

            <button
              class="btn btn-sm btn-light order-btn"
              data-product-id="${escapeAttr(product.id)}"
            >
              Kosárba
            </button>
          </div>
        </div>
      </div>
    `;

    return col;
  }

  async function loadMenu() {
    try {
      const res = await apiFetch("/api/menu");
      const data = await res.json();

      if (!data.success) {
        const msg = data.message || "Nem sikerült betölteni a menüt.";
        burgerList.textContent = msg;
        sideList.textContent = msg;
        drinkList.textContent = msg;
        sauceList.textContent = msg;
        return;
      }

      const products = data.products || [];

      // 👉 termékek map átadása a product modalnak
      const productMap = new Map(products.map((p) => [String(p.id), p]));
      if (typeof window.setProductModalMap === "function") {
        window.setProductModalMap(productMap);
      }

      if (typeof window.setBurgerConfiguratorProductMap === "function") {
        window.setBurgerConfiguratorProductMap(productMap);
      }

      burgerList.innerHTML = "";
      sideList.innerHTML = "";
      drinkList.innerHTML = "";
      sauceList.innerHTML = "";

      const grouped = {
        burger: [],
        side: [],
        drink: [],
        sauce: [],
      };

      products.forEach((p) => {
        const cat = p.category || "burger";
        if (grouped[cat]) grouped[cat].push(p);
        else grouped.burger.push(p);
      });

      function renderCategory(listEl, items, emptyText) {
        if (!listEl) return;
        if (!items || items.length === 0) {
          listEl.textContent = emptyText;
          return;
        }
        items.forEach((p) => listEl.appendChild(createProductCard(p)));
      }

      renderCategory(
        burgerList,
        grouped.burger,
        "Jelenleg nincsenek burgerek a menüben.",
      );
      renderCategory(
        sideList,
        grouped.side,
        "Jelenleg nincsenek köretek a menüben.",
      );
      renderCategory(
        drinkList,
        grouped.drink,
        "Jelenleg nincsenek innivalók a menüben.",
      );
      renderCategory(
        sauceList,
        grouped.sauce,
        "Jelenleg nincsenek szószok a menüben.",
      );
    } catch (err) {
      console.error("Hiba a /api/menu hívásnál:", err);
      const msg = "Nem sikerült csatlakozni a szerverhez.";
      burgerList.textContent = msg;
      sideList.textContent = msg;
      drinkList.textContent = msg;
      sauceList.textContent = msg;
    }
  }

  document.addEventListener("click", (e) => {
    // ha a Kosárba gombra kattintottak, ne nyisson modalt
    if (e.target.closest(".order-btn")) return;

    const card = e.target.closest(".menu-image-card");
    if (!card) return;

    const pid = card.dataset.productId;
    if (!pid) return;

    if (typeof window.openProductModalById === "function") {
      window.openProductModalById(pid);
    }
  });

  loadMenu();
});
