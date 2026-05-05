(function () {
  const SMALL_BURGER_BOX_FEE = 150;
  const MENU_BURGER_BOX_FEE = 200;
  let productById = new Map();
  let toppingOptions = [];
  let modalInstance = null;
  let modalEl = null;
  let titleEl = null;
  let subtitleEl = null;
  let summaryEl = null;
  let contentEl = null;
  let progressEl = null;
  let qtyValueEl = null;
  let backBtnEl = null;
  let nextBtnEl = null;
  let stepLabelEl = null;

  const FALLBACK_IMG = "images/farmburger.png";
  const EXTRA_OPTIONS = {
    sauce: {
      label: "Szószt kérek",
      desc: "Válassz egy darab szószt a menühöz.",
      icon: "bi bi-droplet-half",
      badge: "Szósz",
    },
  };

  let state = null;
  let currentStepKey = "base";

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

  function formatFt(value) {
    return Math.round(Number(value || 0)).toLocaleString("hu-HU");
  }

  function formatOptionPrice(value, withPlus = true) {
    const amount = Number(value || 0);
    return withPlus ? `+ ${formatFt(amount)} Ft` : `${formatFt(amount)} Ft`;
  }

  function getProductImage(product) {
    let imgSrc =
      product?.image_url || product?.imageUrl || product?.image || "";
    if (imgSrc && !imgSrc.startsWith("http") && !imgSrc.startsWith("/")) {
      imgSrc = "/" + imgSrc.replace(/^\/+/, "");
    }
    return imgSrc || FALLBACK_IMG;
  }

  function injectMarkup() {
    if (document.getElementById("burgerConfiguratorModal")) {
      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal fade burger-config-modal" id="burgerConfiguratorModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="burger-config-header">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div class="burger-config-title" id="burgerConfigTitle">Állítsd össze a burgered</div>
                  <div class="burger-config-subtitle" id="burgerConfigSubtitle">Válaszd ki, hogyan kéred a terméket.</div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Bezárás"></button>
              </div>
              <div class="burger-config-progress" id="burgerConfigProgress"></div>
            </div>

            <div class="burger-config-main-layout">
              <aside class="burger-config-sidebar">
                <div class="burger-config-receipt">
                  <div class="burger-config-receipt-title">Rendelés összegző</div>

                  <div class="burger-config-receipt-top">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <strong id="burgerConfigFooterName">Burger</strong>
                      <span class="text-muted fw-semibold">
                        <span id="burgerConfigQtyValue">1</span> db
                      </span>
                    </div>
                  </div>

                  <div id="burgerConfigFooterBreakdown" class="burger-config-breakdown mt-3"></div>

                  <div class="burger-config-sidebar-qty">
                    <div class="burger-config-qty" aria-label="Mennyiség választó">
                      <button type="button" id="burgerConfigQtyMinus" aria-label="Csökkentés">−</button>
                      <div class="burger-config-qty-value" id="burgerConfigQtyValueMirror">1</div>
                      <button type="button" id="burgerConfigQtyPlus" aria-label="Növelés">+</button>
                    </div>
                  </div>
                </div>
              </aside>

              <section class="burger-config-stage">
                <div class="burger-config-stage-top">
                  <div class="burger-config-summary burger-config-summary--top" id="burgerConfigSummary"></div>
                  <div class="text-muted small fw-semibold burger-config-step-pill" id="burgerConfigStepLabel"></div>
                </div>

                <div class="burger-config-body">
                  <div id="burgerConfigContent"></div>
                </div>

                <div class="burger-config-stage-footer">
                  <div class="burger-config-stage-price" id="burgerConfigFooterPrice"></div>

                  <div class="burger-config-footer-actions">
                    <button type="button" class="btn btn-outline-secondary" id="burgerConfigBackBtn">Vissza</button>
                    <button type="button" class="btn btn-warning" id="burgerConfigNextBtn" disabled>Tovább</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      `,
    );
  }

  function cacheRefs() {
    modalEl = document.getElementById("burgerConfiguratorModal");
    titleEl = document.getElementById("burgerConfigTitle");
    subtitleEl = document.getElementById("burgerConfigSubtitle");
    summaryEl = document.getElementById("burgerConfigSummary");
    contentEl = document.getElementById("burgerConfigContent");
    progressEl = document.getElementById("burgerConfigProgress");
    qtyValueEl = document.getElementById("burgerConfigQtyValue");
    backBtnEl = document.getElementById("burgerConfigBackBtn");
    nextBtnEl = document.getElementById("burgerConfigNextBtn");
    stepLabelEl = document.getElementById("burgerConfigStepLabel");
  }

  function ensureModal() {
    injectMarkup();
    if (!modalEl) {
      cacheRefs();
    }
    if (!modalInstance && modalEl && typeof bootstrap !== "undefined") {
      modalInstance = new bootstrap.Modal(modalEl, { keyboard: true });
    }
    return modalInstance;
  }

  function createInitialState(product, initialQty = 1) {
    return {
      productId: Number(product.id),
      productName: product.name || "Burger",
      productPrice: Number(product.price) || 0,
      productImage: getProductImage(product),
      quantity: Math.max(1, Math.min(99, Number(initialQty) || 1)),
      baseType: null,
      sideProductId: null,
      extraType: null,
      sauceId: null,
      toppings: [],
    };
  }

  function normalizeMenuSideName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeMenuExtraType(value) {
    return value === "sauce" || value === "coleslaw" ? value : null;
  }

  function getActiveColeslawProduct() {
    return (
      [...productById.values()].find((product) => {
        return (
          product &&
          product.category === "sauce" &&
          Number(product.is_active ?? 1) === 1 &&
          normalizeMenuExtraType(product.menu_extra_type) === "coleslaw"
        );
      }) || null
    );
  }

  function getSelectedSideProduct() {
    if (!state?.sideProductId) return null;
    return productById.get(String(state.sideProductId)) || null;
  }

  function getSelectedSauceProduct() {
    if (!state?.sauceId || state.extraType !== "sauce") return null;
    return productById.get(String(state.sauceId)) || null;
  }

  function getSelectedToppingProducts() {
    if (!state || !Array.isArray(state.toppings)) {
      return [];
    }

    return state.toppings
      .map((id) =>
        toppingOptions.find((item) => Number(item.id) === Number(id)),
      )
      .filter(Boolean);
  }

  function getPackagingFee() {
    if (!state?.baseType) {
      return 0;
    }

    return state.baseType === "menu"
      ? MENU_BURGER_BOX_FEE
      : SMALL_BURGER_BOX_FEE;
  }

  function getPackagingLabel() {
    if (!state?.baseType) {
      return null;
    }

    return state.baseType === "menu" ? "Nagy doboz" : "Kis doboz";
  }

  function getConfiguredUnitPrice() {
    if (!state) return 0;

    let total = Number(state.productPrice) || 0;
    total += getPackagingFee();

    if (state.baseType === "menu") {
      const side = getSelectedSideProduct();
      if (side) {
        total += Number(side.price || 0);
      }

      if (state.extraType === "sauce") {
        const sauce = getSelectedSauceProduct();
        if (sauce) {
          total += Number(sauce.price || 0);
        }
      } else if (state.extraType === "coleslaw") {
        const coleslaw = getActiveColeslawProduct();
        if (coleslaw) {
          total += Number(coleslaw.price || 0);
        }
      }
    }

    getSelectedToppingProducts().forEach((topping) => {
      total += Number(topping.price || 0);
    });

    return total;
  }

  function getConfiguredTotalPrice() {
    return getConfiguredUnitPrice() * Number(state?.quantity || 1);
  }

  function getPriceBreakdownItems() {
    if (!state) return [];

    const items = [
      {
        label: "Burger alapár",
        amount: Number(state.productPrice || 0),
      },
    ];

    const packagingLabel = getPackagingLabel();
    if (packagingLabel) {
      items.push({
        label: packagingLabel,
        amount: getPackagingFee(),
      });
    }

    if (state.baseType === "menu") {
      const side = getSelectedSideProduct();
      if (side) {
        items.push({
          label: side.name || "Köret",
          amount: Number(side.price || 0),
        });
      }

      if (state.extraType === "sauce") {
        const sauce = getSelectedSauceProduct();
        if (sauce) {
          items.push({
            label: sauce.name || "Szósz",
            amount: Number(sauce.price || 0),
          });
        }
      } else if (state.extraType === "coleslaw") {
        const coleslaw = getActiveColeslawProduct();
        if (coleslaw) {
          items.push({
            label: coleslaw.name || "Coleslaw saláta",
            amount: Number(coleslaw.price || 0),
          });
        }
      }
    }

    getSelectedToppingProducts().forEach((topping) => {
      items.push({
        label: topping.name || "Extra feltét",
        amount: Number(topping.price || 0),
      });
    });

    return items;
  }

  function renderFooterBreakdownHtml() {
    const items = getPriceBreakdownItems();
    const totalPrice = getConfiguredTotalPrice();
    const quantity = Number(state?.quantity || 1);

    return `
    <div class="border-top pt-2">
      <div class="fw-semibold mb-1">Ár részletezése</div>
      ${items
        .map((item) => {
          const lineAmount = Number(item.amount || 0) * quantity;

          return `
            <div class="d-flex justify-content-between">
              <span>${escapeHtml(item.label)}</span>
              <span>${formatFt(lineAmount)} Ft</span>
            </div>
          `;
        })
        .join("")}
      <div class="d-flex justify-content-between mt-2 pt-1 border-top fw-semibold">
        <span>Összesen</span>
        <span>${formatFt(totalPrice)} Ft</span>
      </div>
    </div>
  `;
  }

  function getActiveSauces() {
    return [...productById.values()].filter((product) => {
      return (
        product &&
        product.category === "sauce" &&
        Number(product.is_active ?? 1) === 1 &&
        normalizeMenuExtraType(product.menu_extra_type) === "sauce"
      );
    });
  }

  function getActiveSides() {
    const allowedSideNames = new Set(["crispers burgonya", "edesburgonya"]);

    return [...productById.values()].filter((product) => {
      if (!product) return false;
      if (product.category !== "side") return false;
      if (Number(product.is_active ?? 1) !== 1) return false;

      const normalizedName = normalizeMenuSideName(product.name);
      return allowedSideNames.has(normalizedName);
    });
  }

  async function loadToppings() {
    try {
      const res = await fetch("/api/toppings");
      const data = await res.json();

      if (!data.success) {
        console.warn("Nem sikerült betölteni a toppingokat:", data.message);
        toppingOptions = [];
        return;
      }

      toppingOptions = Array.isArray(data.toppings) ? data.toppings : [];
    } catch (err) {
      console.error("Hiba a toppingok betöltésekor:", err);
      toppingOptions = [];
    }
  }

  function getStepKeys() {
    const steps = ["base"];

    if (state?.baseType === "menu") {
      steps.push("side", "extra");
      if (state.extraType === "sauce") {
        steps.push("sauce");
      }
    }

    steps.push("toppings");
    return steps;
  }

  function getStepMeta(stepKey) {
    switch (stepKey) {
      case "base":
        return {
          title: "Hogyan kéred a burgert?",
          subtitle: "Válaszd ki, hogy simán vagy menüben szeretnéd a burgert.",
        };
      case "side":
        return {
          title: "Melyik menüt választod?",
          subtitle: "Döntsd el, milyen körettel kéred a menüt.",
        };
      case "extra":
        return {
          title: "Mi járjon a menühöz?",
          subtitle: "Válassz coleslaw salátát vagy egy darab szószt.",
        };
      case "sauce":
        return {
          title: "Melyik szószt kéred?",
          subtitle: "A menühöz egy darab szósz választható.",
        };

      case "toppings":
        return {
          title: "Kérsz extra feltétet?",
          subtitle:
            "Tetszőlegesen választhatsz extra feltéteket a burgeredhez.",
        };
      default:
        return {
          title: "Állítsd össze a burgered",
          subtitle: "Válaszd ki a megfelelő opciót.",
        };
    }
  }

  function getCurrentStepIndex() {
    return getStepKeys().indexOf(currentStepKey);
  }

  function isCurrentStepValid() {
    if (!state) return false;
    switch (currentStepKey) {
      case "base":
        return Boolean(state.baseType);
      case "side":
        return Boolean(state.sideProductId);
      case "extra":
        return Boolean(state.extraType);
      case "sauce":
        return Boolean(state.sauceId);
      case "toppings":
        return true;
      default:
        return false;
    }
  }

  function renderProgress() {
    if (!progressEl || !stepLabelEl) return;
    const steps = getStepKeys();
    const currentIndex = getCurrentStepIndex();

    progressEl.innerHTML = steps
      .map((_, index) => {
        const status =
          index < currentIndex
            ? "is-complete"
            : index === currentIndex
              ? "is-active"
              : "";
        return `<div class="burger-config-progress-step ${status}"></div>`;
      })
      .join("");

    stepLabelEl.textContent = `Lépés ${currentIndex + 1} / ${steps.length}`;
  }

  function renderSummary() {
    if (!summaryEl || !state) return;

    const chips = [
      `<span class="burger-config-chip"><i class="bi bi-bag"></i>${escapeHtml(state.productName)}</span>`,
    ];

    if (state.baseType === "single") {
      chips.push(
        `<span class="burger-config-chip"><i class="bi bi-dot"></i>Sima burger</span>`,
      );
    }

    const packagingLabel = getPackagingLabel();
    if (packagingLabel) {
      chips.push(
        `<span class="burger-config-chip"><i class="bi bi-box-seam"></i>${escapeHtml(packagingLabel)}</span>`,
      );
    }

    if (state.baseType === "menu") {
      chips.push(
        `<span class="burger-config-chip"><i class="bi bi-grid"></i>Menü</span>`,
      );

      const side = getSelectedSideProduct();
      if (side) {
        chips.push(
          `<span class="burger-config-chip"><i class="bi bi-emoji-smile"></i>${escapeHtml(side.name)}</span>`,
        );
      }

      if (state.extraType === "coleslaw") {
        const coleslaw = getActiveColeslawProduct();
        chips.push(
          `<span class="burger-config-chip"><i class="bi bi-flower1"></i>${escapeHtml(coleslaw?.name || "Coleslaw saláta")}</span>`,
        );
      }

      if (state.extraType === "sauce") {
        chips.push(
          `<span class="burger-config-chip"><i class="bi bi-bookmark-heart"></i>${escapeHtml(EXTRA_OPTIONS.sauce.label)}</span>`,
        );
      }

      if (state.sauceId && state.extraType === "sauce") {
        const sauce = getSelectedSauceProduct();
        if (sauce) {
          chips.push(
            `<span class="burger-config-chip"><i class="bi bi-droplet-half"></i>${escapeHtml(sauce.name)}</span>`,
          );
        }
      }
    }

    if (Array.isArray(state.toppings) && state.toppings.length > 0) {
      state.toppings.forEach((toppingId) => {
        const topping = toppingOptions.find(
          (item) => Number(item.id) === Number(toppingId),
        );

        if (topping) {
          chips.push(
            `<span class="burger-config-chip"><i class="bi bi-plus-circle"></i>${escapeHtml(topping.name)}</span>`,
          );
        }
      });
    }

    summaryEl.innerHTML = chips.join("");
  }

  function renderBaseStep() {
    if (!contentEl || !state) return;
    contentEl.innerHTML = `
    <div class="burger-config-grid two-cols burger-config-grid--fill">
      <button type="button" class="burger-config-option ${state.baseType === "single" ? "is-selected" : ""}" data-config-select="base" data-config-value="single">
        <div class="burger-config-option-visual">
          <img src="${escapeAttr(state.productImage)}" alt="${escapeAttr(state.productName)}">
          <span class="burger-config-option-badge"><i class="bi bi-bag"></i>Csak burger</span>
          <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
        </div>
        <div class="burger-config-option-body">
          <div class="burger-config-option-title">Sima burger</div>
          <p class="burger-config-option-desc">Csak a kiválasztott burger kerül a kosaradba. Gyors rendeléshez ez a legegyszerűbb opció.</p>
          <div class="fw-bold text-warning mt-2">${formatOptionPrice(state.productPrice, false)}</div>
        </div>
      </button>

      <button type="button" class="burger-config-option ${state.baseType === "menu" ? "is-selected" : ""}" data-config-select="base" data-config-value="menu">
        <div class="burger-config-option-visual">
          <img src="${escapeAttr(state.productImage)}" alt="${escapeAttr(state.productName)} menüben">
          <span class="burger-config-option-badge"><i class="bi bi-stars"></i>Menü</span>
          <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
        </div>
        <div class="burger-config-option-body">
          <div class="burger-config-option-title">Burger menüben</div>
          <p class="burger-config-option-desc">Lépésről lépésre összeállíthatod a köretet és a kiegészítőt is. Ez a menüs összeállítás első lépése.</p>
          <div class="fw-bold text-warning mt-2">${formatOptionPrice(state.productPrice, false)} + választott köret és kiegészítők</div>
        </div>
      </button>
    </div>
  `;
  }

  function renderSideStep() {
    if (!contentEl || !state) return;

    const sides = getActiveSides();

    if (sides.length === 0) {
      contentEl.innerHTML = `
      <div class="alert alert-warning mb-0">
        Jelenleg nincs aktív köret a menühöz, ezért ezt az opciót most nem lehet végigvinni.
      </div>
    `;
      return;
    }

    const gridClass =
      sides.length === 2
        ? "burger-config-grid two-cols burger-config-grid--fill"
        : "burger-config-grid two-cols";

    contentEl.innerHTML = `
        <div class="${gridClass}">
      ${sides
        .map(
          (side) => `
          <button
            type="button"
            class="burger-config-option ${Number(state.sideProductId) === Number(side.id) ? "is-selected" : ""}"
            data-config-select="side"
            data-config-value="${escapeAttr(side.id)}"
          >
            <div class="burger-config-option-visual">
              <img src="${escapeAttr(getProductImage(side))}" alt="${escapeAttr(side.name || "Köret")}">
              <span class="burger-config-option-badge">
                <i class="bi bi-emoji-smile"></i>${escapeHtml(side.name || "Köret")}
              </span>
              <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
            </div>
            <div class="burger-config-option-body">
              <div class="burger-config-option-title">${escapeHtml(side.name || "Köret")}</div>
              <p class="burger-config-option-desc">${escapeHtml(side.description || "Válaszd ki a menühöz tartozó köretet.")}</p>
              <div class="fw-bold text-warning mt-2">${formatOptionPrice(side.price)}</div>
            </div>
          </button>
        `,
        )
        .join("")}
    </div>
  `;
  }

  function renderExtraStep() {
    if (!contentEl || !state) return;

    const extraOptions = [];
    const coleslawProduct = getActiveColeslawProduct();
    const sauces = getActiveSauces();

    if (coleslawProduct) {
      extraOptions.push({
        value: "coleslaw",
        label: coleslawProduct.name || "Coleslaw saláta",
        desc:
          coleslawProduct.description ||
          "A menühöz egy adag friss coleslaw saláta jár.",
        icon: "bi bi-flower1",
        badge: "Coleslaw",
        priceLabel: formatOptionPrice(coleslawProduct.price),
      });
    }

    if (sauces.length > 0) {
      extraOptions.push({
        value: "sauce",
        label: EXTRA_OPTIONS.sauce.label,
        desc: EXTRA_OPTIONS.sauce.desc,
        icon: EXTRA_OPTIONS.sauce.icon,
        badge: EXTRA_OPTIONS.sauce.badge,
        priceLabel: "A pontos ár a következő lépésben látszik",
      });
    }

    if (extraOptions.length === 0) {
      contentEl.innerHTML = `
      <div class="alert alert-warning mb-0">
        Jelenleg nincs aktív menü kiegészítő, ezért ezt az opciót most nem lehet végigvinni.
      </div>
    `;
      return;
    }

    const gridClass =
      extraOptions.length === 2
        ? "burger-config-grid two-cols burger-config-grid--fill"
        : "burger-config-grid two-cols";

    contentEl.innerHTML = `
        <div class="${gridClass}">
      ${extraOptions
        .map(
          (item) => `
            <button type="button" class="burger-config-option ${state.extraType === item.value ? "is-selected" : ""}" data-config-select="extra" data-config-value="${escapeAttr(item.value)}">
              <div class="burger-config-option-visual d-flex align-items-center justify-content-center">
                <span class="burger-config-option-badge"><i class="${escapeAttr(item.icon)}"></i>${escapeHtml(item.badge)}</span>
                <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
                <i class="${escapeAttr(item.icon)} text-white" style="font-size: 4rem;"></i>
              </div>
              <div class="burger-config-option-body">
                <div class="burger-config-option-title">${escapeHtml(item.label)}</div>
                <p class="burger-config-option-desc">${escapeHtml(item.desc)}</p>
                <div class="fw-bold text-warning mt-2">${escapeHtml(item.priceLabel)}</div>
              </div>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
  }

  function renderSauceStep() {
    if (!contentEl || !state) return;
    const sauces = getActiveSauces();

    if (sauces.length === 0) {
      contentEl.innerHTML = `
      <div class="alert alert-warning mb-0">
        Jelenleg nincs aktív szósz a menüben, ezért ezt az opciót most nem lehet végigvinni.
      </div>
    `;
      return;
    }

    const gridClass =
      sauces.length === 2
        ? "burger-config-grid two-cols burger-config-grid--fill"
        : "burger-config-grid two-cols";

    contentEl.innerHTML = `
        <div class="${gridClass}">
      ${sauces
        .map(
          (sauce) => `
            <button type="button" class="burger-config-option ${Number(state.sauceId) === Number(sauce.id) ? "is-selected" : ""}" data-config-select="sauce" data-config-value="${escapeAttr(sauce.id)}">
              <div class="burger-config-option-visual d-flex align-items-center justify-content-center">
                <span class="burger-config-option-badge"><i class="bi bi-droplet-half"></i>Szósz</span>
                <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
                <i class="bi bi-droplet-half text-white" style="font-size: 4rem;"></i>
              </div>
              <div class="burger-config-option-body">
                <div class="burger-config-option-title">${escapeHtml(sauce.name || "Szósz")}</div>
                <p class="burger-config-option-desc">${escapeHtml(sauce.description || "Egy darab szósz kerül a menühöz.")}</p>
                <div class="fw-bold text-warning mt-2">${formatOptionPrice(sauce.price)}</div>
              </div>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
  }

  function renderToppingsStep() {
    if (!contentEl || !state) return;

    if (!Array.isArray(toppingOptions) || toppingOptions.length === 0) {
      contentEl.innerHTML = `
      <div class="alert alert-secondary mb-0">
        Jelenleg nincs aktív extra feltét, ezért ezt a lépést kihagyhatod.
      </div>
    `;
      return;
    }

    contentEl.innerHTML = `
    <div class="burger-config-grid two-cols">
      ${toppingOptions
        .map(
          (topping) => `
            <button
              type="button"
              class="burger-config-option ${state.toppings.includes(Number(topping.id)) ? "is-selected" : ""}"
              data-config-select="topping"
              data-config-value="${escapeAttr(topping.id)}"
            >
              <div class="burger-config-option-visual d-flex align-items-center justify-content-center">
                <span class="burger-config-option-badge">
                  <i class="bi bi-plus-circle"></i>Extra feltét
                </span>
                <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
                <i class="bi bi-plus-circle text-white" style="font-size: 4rem;"></i>
              </div>
              <div class="burger-config-option-body">
                <div class="burger-config-option-title">${escapeHtml(topping.name)}</div>
                <p class="burger-config-option-desc">
                  ${escapeHtml(topping.description || "Extra feltét a burgeredhez.")}
                </p>
                <div class="fw-bold text-warning mt-2">${formatOptionPrice(topping.price)}</div>
              </div>
            </button>
          `,
        )
        .join("")}
    </div>
    <div class="burger-config-note">
      Több extra feltétet is kiválaszthatsz, de ez a lépés opcionális.
    </div>
  `;
  }

  function renderContent() {
    const stepMeta = getStepMeta(currentStepKey);
    if (titleEl) titleEl.textContent = stepMeta.title;
    if (subtitleEl) subtitleEl.textContent = stepMeta.subtitle;

    switch (currentStepKey) {
      case "base":
        renderBaseStep();
        break;
      case "side":
        renderSideStep();
        break;
      case "extra":
        renderExtraStep();
        break;
      case "sauce":
        renderSauceStep();
        break;
      case "toppings":
        renderToppingsStep();
        break;
      default:
        renderBaseStep();
        break;
    }
  }

  function renderFooter() {
    if (!state || !qtyValueEl || !backBtnEl || !nextBtnEl) return;

    qtyValueEl.textContent = String(state.quantity);

    const qtyMirrorEl = document.getElementById("burgerConfigQtyValueMirror");
    const nameEl = document.getElementById("burgerConfigFooterName");
    const stageNameEl = document.getElementById("burgerConfigStageProductName");
    const priceEl = document.getElementById("burgerConfigFooterPrice");
    const breakdownEl = document.getElementById("burgerConfigFooterBreakdown");

    if (qtyMirrorEl) {
      qtyMirrorEl.textContent = String(state.quantity);
    }

    if (nameEl) {
      nameEl.textContent =
        state.baseType === "menu"
          ? `${state.productName} menü`
          : state.productName;
    }

    if (stageNameEl) {
      stageNameEl.textContent = state.productName;
    }

    if (priceEl) {
      priceEl.textContent = "";
    }

    if (breakdownEl) {
      breakdownEl.innerHTML = renderFooterBreakdownHtml();
    }

    const steps = getStepKeys();
    const currentIndex = getCurrentStepIndex();
    const isLast = currentIndex === steps.length - 1;

    backBtnEl.style.visibility = currentIndex === 0 ? "hidden" : "visible";
    nextBtnEl.disabled = !isCurrentStepValid();
    nextBtnEl.textContent = isLast ? "Kosárba" : "Tovább";
  }

  function renderAll() {
    renderProgress();
    renderSummary();
    renderContent();
    renderFooter();
  }

  function showToast(type, message) {
    const el = document.createElement("div");
    el.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3 shadow`;
    el.style.zIndex = "2000";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  async function addConfiguredBurgerToCart(config = null) {
    const res = await apiFetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: Number(state.productId),
        quantity: Number(state.quantity) || 1,
        config,
      }),
    });

    if (res.status === 401) {
      if (typeof window.showAlert === "function") {
        window.showAlert(
          "warning",
          "A kosár használatához előbb be kell jelentkezned.",
        );
      } else {
        showToast(
          "warning",
          "A kosár használatához előbb be kell jelentkezned.",
        );
      }

      setTimeout(() => {
        window.location.href = "/fiok.html";
      }, 1200);

      throw new Error("Bejelentkezés szükséges a kosár használatához.");
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(
        data.message || "Nem sikerült a terméket a kosárba tenni.",
      );
    }

    if (typeof window.loadCartSummary === "function") {
      await window.loadCartSummary();
    }

    if (typeof window.showAlert === "function") {
      window.showAlert("success", "A burger bekerült a kosaradba.");
    } else {
      showToast("success", "A burger bekerült a kosaradba.");
    }
  }

  async function handleFinish() {
    if (!state) return;

    try {
      const normalizedToppings = Array.isArray(state.toppings)
        ? state.toppings
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        : [];

      let config = null;

      if (state.baseType === "single") {
        config = {
          baseType: "single",
          toppings: normalizedToppings,
        };
      } else {
        config = {
          baseType: "menu",
          sideProductId: Number(state.sideProductId || 0),
          extraType: state.extraType,
          sauceId:
            state.extraType === "sauce" ? Number(state.sauceId || 0) : null,
          toppings: normalizedToppings,
        };
      }

      await addConfiguredBurgerToCart(config);

      if (modalInstance) {
        modalInstance.hide();
      }
    } catch (err) {
      console.error("Hiba a burger kosárba tételénél:", err);

      if (typeof window.showAlert === "function") {
        window.showAlert(
          "danger",
          err.message || "Nem sikerült a burgert a kosárba tenni.",
        );
      } else {
        showToast(
          "danger",
          err.message || "Nem sikerült a burgert a kosárba tenni.",
        );
      }
    }
  }

  function goNext() {
    if (!isCurrentStepValid()) return;

    const steps = getStepKeys();
    const currentIndex = getCurrentStepIndex();
    const isLast = currentIndex === steps.length - 1;

    if (isLast) {
      handleFinish();
      return;
    }

    currentStepKey = steps[currentIndex + 1];
    renderAll();
  }

  function goBack() {
    const steps = getStepKeys();
    const currentIndex = getCurrentStepIndex();
    if (currentIndex <= 0) return;
    currentStepKey = steps[currentIndex - 1];
    renderAll();
  }

  function updateQuantity(next) {
    if (!state) return;
    state.quantity = Math.max(1, Math.min(99, Number(next) || 1));
    renderFooter();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const optionBtn = event.target.closest("[data-config-select]");
      if (!optionBtn || !modalEl || !modalEl.contains(optionBtn) || !state)
        return;

      const kind = optionBtn.dataset.configSelect;
      const value = optionBtn.dataset.configValue;
      if (!kind || !value) return;

      if (kind === "base") {
        state.baseType = value;
        if (value === "single") {
          state.sideProductId = null;
          state.extraType = null;
          state.sauceId = null;
        }
      }

      if (kind === "side") {
        const sideProductId = Number(value);
        if (!Number.isInteger(sideProductId) || sideProductId <= 0) {
          return;
        }
        state.sideProductId = sideProductId;
      }

      if (kind === "extra") {
        state.extraType = value;
        if (value !== "sauce") {
          state.sauceId = null;
        }
      }

      if (kind === "sauce") {
        state.sauceId = Number(value);
      }

      if (kind === "topping") {
        const toppingId = Number(value);

        if (!Number.isInteger(toppingId) || toppingId <= 0) {
          return;
        }

        const exists = state.toppings.includes(toppingId);

        if (exists) {
          state.toppings = state.toppings.filter((id) => id !== toppingId);
        } else {
          state.toppings = [...state.toppings, toppingId];
        }
      }

      renderAll();
    });

    document.addEventListener("click", (event) => {
      const minusBtn = event.target.closest("#burgerConfigQtyMinus");
      const plusBtn = event.target.closest("#burgerConfigQtyPlus");
      const backBtn = event.target.closest("#burgerConfigBackBtn");
      const nextBtn = event.target.closest("#burgerConfigNextBtn");

      if (minusBtn) updateQuantity((state?.quantity || 1) - 1);
      if (plusBtn) updateQuantity((state?.quantity || 1) + 1);
      if (backBtn) goBack();
      if (nextBtn) goNext();
    });

    document.addEventListener("hidden.bs.modal", (event) => {
      if (event.target?.id === "burgerConfiguratorModal") {
        state = null;
        currentStepKey = "base";
      }
    });
  }

  function openConfigurator(product, options = {}) {
    if (!product || product.category !== "burger") return false;
    const inst = ensureModal();
    if (!inst) return false;

    state = createInitialState(product, options.initialQty || 1);
    currentStepKey = "base";
    renderAll();
    inst.show();
    return true;
  }

  window.setBurgerConfiguratorProductMap = (map) => {
    if (map instanceof Map) {
      productById = new Map(map);
    }
  };

  window.tryOpenBurgerConfigurator = (productId, options = {}) => {
    const product = productById.get(String(productId));
    if (!product || product.category !== "burger") {
      return false;
    }
    return openConfigurator(product, options);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      injectMarkup();
      cacheRefs();
      bindEvents();
      await loadToppings();
    });
  } else {
    injectMarkup();
    cacheRefs();
    bindEvents();
    loadToppings();
  }
})();
