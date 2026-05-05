// public/productModal.js
// Ez a fájl kezeli a termék részletek modalt (kép, leírás, összetevők, qty, kosárba, accordion)

(function () {
  // --- Product modal refs ---
  const modalEl = document.getElementById("productDetailsModal");
  const pModalImg = document.getElementById("pModalImg");
  const pModalTitle = document.getElementById("pModalTitle");
  const pModalPrice = document.getElementById("pModalPrice");
  const pModalDesc = document.getElementById("pModalDesc");
  const pModalIngredientsSection = document.getElementById(
    "pModalIngredientsSection",
  );
  const pModalIngredients = document.getElementById("pModalIngredients");
  const pQtyMinus = document.getElementById("pQtyMinus");
  const pQtyPlus = document.getElementById("pQtyPlus");
  const pQtyValue = document.getElementById("pQtyValue");
  const pModalAddBtn = document.getElementById("pModalAddBtn");

  let modalInstance = null;

  // Ezt kívülről adjuk be: new Map([ [id, product], ... ])
  let productById = new Map();

  let currentProduct = null;
  let currentQty = 1;

  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  function ensureModal() {
    if (!modalEl) return null;
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(modalEl, { keyboard: true });
    }
    return modalInstance;
  }

  function setQty(next) {
    const v = Math.max(1, Math.min(99, Number(next) || 1));
    currentQty = v;
    if (pQtyValue) pQtyValue.textContent = String(v);
  }

  function showMiniToast(type, message) {
    const el = document.createElement("div");
    el.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3 shadow`;
    el.style.zIndex = "9999";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function openProductModal(product) {
    const inst = ensureModal();
    if (!inst || !product) return;

    currentProduct = product;
    setQty(1);

    const fallbackImg = "images/farmburger.png";
    let imgSrc = product.image_url || product.imageUrl || product.image || "";
    if (imgSrc && !imgSrc.startsWith("http") && !imgSrc.startsWith("/")) {
      imgSrc = "/" + imgSrc.replace(/^\/+/, "");
    }
    if (!imgSrc) imgSrc = fallbackImg;

    if (pModalImg) {
      pModalImg.src = imgSrc;
      pModalImg.alt = product.name || "Termék";
    }

    if (pModalTitle) pModalTitle.textContent = product.name || "Termék";
    if (pModalPrice) pModalPrice.textContent = `${formatFt(product.price)} Ft`;

    const desc = (product.description || "").trim();
    if (pModalDesc) {
      pModalDesc.textContent = desc || " ";
    }

    // Leírás zárva indul (nálad ez a kívánt)
    document
      .querySelectorAll('.product-accordion-header[data-target="desc"]')
      .forEach((el) => el.classList.remove("is-open"));

    document
      .querySelectorAll('.product-accordion-content[data-content="desc"]')
      .forEach((el) => el.classList.remove("is-open"));

    // Összetevők
    const ing = Array.isArray(product.ingredients) ? product.ingredients : [];

    if (pModalIngredientsSection && pModalIngredients) {
      pModalIngredientsSection.style.display = "block";

      if (ing.length > 0) {
        pModalIngredients.textContent = ing.join(", ");
      } else {
        pModalIngredients.textContent = "Jelenleg nincs megadva összetevő.";
      }

      // Összetevők alapból zárva
      pModalIngredientsSection
        .querySelector(".product-accordion-header")
        .classList.remove("is-open");

      pModalIngredientsSection
        .querySelector(".product-accordion-content")
        .classList.remove("is-open");
    }

    inst.show();
  }

  // Modal qty controls
  if (pQtyMinus)
    pQtyMinus.addEventListener("click", () => setQty(currentQty - 1));
  if (pQtyPlus)
    pQtyPlus.addEventListener("click", () => setQty(currentQty + 1));

  // Modal add to cart (mennyiséggel)
  if (pModalAddBtn) {
    pModalAddBtn.addEventListener("click", async () => {
      if (!currentProduct?.id) return;

      if (typeof window.tryOpenBurgerConfigurator === "function") {
        const handled = window.tryOpenBurgerConfigurator(currentProduct.id, {
          initialQty: Number(currentQty) || 1,
        });
        if (handled) {
          const inst = ensureModal();
          if (inst) inst.hide();
          return;
        }
      }

      try {
        const res = await apiFetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: Number(currentProduct.id),
            quantity: Number(currentQty) || 1,
          }),
        });

        const data = await res.json();

        if (data.success) {
          if (typeof window.loadCartSummary === "function") {
            await window.loadCartSummary();
          }
          showMiniToast("success", "A termék bekerült a kosaradba.");
          const inst = ensureModal();
          if (inst) inst.hide();
        } else {
          showMiniToast(
            "danger",
            data.message || "Nem sikerült a kosárba tenni.",
          );
        }
      } catch (err) {
        console.error("Hiba a kosárba tételnél (modal):", err);
        showMiniToast("danger", "Nem sikerült csatlakozni a szerverhez.");
      }
    });
  }

  // Product modal accordion toggle
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".product-accordion-header");
    if (!header) return;

    const target = header.dataset.target;
    if (!target) return;

    const content = document.querySelector(
      `.product-accordion-content[data-content="${target}"]`,
    );

    if (!content) return;

    const isOpen = header.classList.contains("is-open");

    header.classList.toggle("is-open", !isOpen);
    content.classList.toggle("is-open", !isOpen);
  });

  // ===== Public API más oldalaknak =====

  // Beadod a termék mapet (menu oldal: teljes menu; index: special offers, vagy teljes list)
  window.setProductModalMap = (map) => {
    if (map instanceof Map) {
      productById = map;
    } else {
      // ha véletlen objektum jön, ne törjön
      productById = new Map();
    }
  };

  // Közvetlen nyitás termék objektummal
  window.openProductModal = (product) => openProductModal(product);

  // Nyitás productId alapján
  window.openProductModalById = (id) => {
    const p = productById.get(String(id));
    if (p) openProductModal(p);
  };
})();
