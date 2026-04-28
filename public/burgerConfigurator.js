(function () {
  let productById = new Map();
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
  const SIDE_OPTIONS = {
    crispers: {
      label: "Crispers menü",
      desc: "A burger mellé ropogós crispers burgonya jár.",
      icon: "bi bi-stars",
      badge: "Crispers",
    },
    sweet_potato: {
      label: "Édesburgonyás menü",
      desc: "A burger mellé édesburgonya köret jár.",
      icon: "bi bi-emoji-smile",
      badge: "Édesburgonya",
    },
  };
  const EXTRA_OPTIONS = {
    coleslaw: {
      label: "Coleslaw saláta",
      desc: "A menühöz egy adag friss coleslaw saláta jár.",
      icon: "bi bi-flower1",
      badge: "Coleslaw",
    },
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

            <div class="burger-config-body">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div class="burger-config-summary" id="burgerConfigSummary"></div>
                <div class="text-muted small fw-semibold" id="burgerConfigStepLabel"></div>
              </div>
              <div id="burgerConfigContent"></div>
            </div>

            <div class="burger-config-footer">
              <div class="d-flex align-items-center gap-3 flex-wrap">
                <div class="burger-config-qty" aria-label="Mennyiség választó">
                  <button type="button" id="burgerConfigQtyMinus" aria-label="Csökkentés">−</button>
                  <div class="burger-config-qty-value" id="burgerConfigQtyValue">1</div>
                  <button type="button" id="burgerConfigQtyPlus" aria-label="Növelés">+</button>
                </div>
                <div class="text-muted small">
                  <strong id="burgerConfigFooterName">Burger</strong>
                  <span class="ms-2" id="burgerConfigFooterPrice">0 Ft</span>
                </div>
              </div>

              <div class="burger-config-footer-actions">
                <button type="button" class="btn btn-outline-secondary" id="burgerConfigBackBtn">Vissza</button>
                <button type="button" class="btn btn-warning" id="burgerConfigNextBtn" disabled>Tovább</button>
              </div>
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
      sideType: null,
      extraType: null,
      sauceId: null,
    };
  }

  function getActiveSauces() {
    return [...productById.values()].filter((product) => {
      return (
        product &&
        product.category === "sauce" &&
        Number(product.is_active ?? 1) === 1
      );
    });
  }

  function getStepKeys() {
    const steps = ["base"];
    if (state?.baseType === "menu") {
      steps.push("side", "extra");
      if (state.extraType === "sauce") {
        steps.push("sauce");
      }
    }
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
        return Boolean(state.sideType);
      case "extra":
        return Boolean(state.extraType);
      case "sauce":
        return Boolean(state.sauceId);
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

    if (state.baseType === "menu") {
      chips.push(
        `<span class="burger-config-chip"><i class="bi bi-grid"></i>Menü</span>`,
      );
      if (state.sideType) {
        chips.push(
          `<span class="burger-config-chip"><i class="bi bi-emoji-smile"></i>${escapeHtml(SIDE_OPTIONS[state.sideType].label)}</span>`,
        );
      }
      if (state.extraType) {
        chips.push(
          `<span class="burger-config-chip"><i class="bi bi-bookmark-heart"></i>${escapeHtml(EXTRA_OPTIONS[state.extraType].label)}</span>`,
        );
      }
      if (state.sauceId) {
        const sauce = productById.get(String(state.sauceId));
        if (sauce) {
          chips.push(
            `<span class="burger-config-chip"><i class="bi bi-droplet-half"></i>${escapeHtml(sauce.name)}</span>`,
          );
        }
      }
    }

    summaryEl.innerHTML = chips.join("");
  }

  function renderBaseStep() {
    if (!contentEl || !state) return;
    contentEl.innerHTML = `
      <div class="burger-config-grid two-cols">
        <button type="button" class="burger-config-option ${state.baseType === "single" ? "is-selected" : ""}" data-config-select="base" data-config-value="single">
          <div class="burger-config-option-visual">
            <img src="${escapeAttr(state.productImage)}" alt="${escapeAttr(state.productName)}">
            <span class="burger-config-option-badge"><i class="bi bi-bag"></i>Csak burger</span>
            <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
          </div>
          <div class="burger-config-option-body">
            <div class="burger-config-option-title">Sima burger</div>
            <p class="burger-config-option-desc">Csak a kiválasztott burger kerül a kosaradba. Gyors rendeléshez ez a legegyszerűbb opció.</p>
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
          </div>
        </button>
      </div>
      <div class="burger-config-note">A sima burger rögtön kosárba rakható, a menüs verziónál még végigvezetünk a választásokon.</div>
    `;
  }

  function renderSideStep() {
    if (!contentEl || !state) return;
    contentEl.innerHTML = `
      <div class="burger-config-grid two-cols">
        ${Object.entries(SIDE_OPTIONS)
          .map(
            ([value, item]) => `
            <button type="button" class="burger-config-option ${state.sideType === value ? "is-selected" : ""}" data-config-select="side" data-config-value="${escapeAttr(value)}">
              <div class="burger-config-option-visual d-flex align-items-center justify-content-center">
                <span class="burger-config-option-badge"><i class="${escapeAttr(item.icon)}"></i>${escapeHtml(item.badge)}</span>
                <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
                <i class="${escapeAttr(item.icon)} text-white" style="font-size: 4rem;"></i>
              </div>
              <div class="burger-config-option-body">
                <div class="burger-config-option-title">${escapeHtml(item.label)}</div>
                <p class="burger-config-option-desc">${escapeHtml(item.desc)}</p>
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
    contentEl.innerHTML = `
      <div class="burger-config-grid two-cols">
        ${Object.entries(EXTRA_OPTIONS)
          .map(
            ([value, item]) => `
            <button type="button" class="burger-config-option ${state.extraType === value ? "is-selected" : ""}" data-config-select="extra" data-config-value="${escapeAttr(value)}">
              <div class="burger-config-option-visual d-flex align-items-center justify-content-center">
                <span class="burger-config-option-badge"><i class="${escapeAttr(item.icon)}"></i>${escapeHtml(item.badge)}</span>
                <span class="burger-config-option-check"><i class="bi bi-check2"></i></span>
                <i class="${escapeAttr(item.icon)} text-white" style="font-size: 4rem;"></i>
              </div>
              <div class="burger-config-option-body">
                <div class="burger-config-option-title">${escapeHtml(item.label)}</div>
                <p class="burger-config-option-desc">${escapeHtml(item.desc)}</p>
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

    contentEl.innerHTML = `
      <div class="burger-config-grid two-cols">
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
              </div>
            </button>
          `,
          )
          .join("")}
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
      default:
        renderBaseStep();
        break;
    }
  }

  function renderFooter() {
    if (!state || !qtyValueEl || !backBtnEl || !nextBtnEl) return;
    qtyValueEl.textContent = String(state.quantity);

    const nameEl = document.getElementById("burgerConfigFooterName");
    const priceEl = document.getElementById("burgerConfigFooterPrice");
    if (nameEl) nameEl.textContent = state.productName;
    if (priceEl) priceEl.textContent = `${formatFt(state.productPrice)} Ft`;

    const steps = getStepKeys();
    const currentIndex = getCurrentStepIndex();
    const isLast = currentIndex === steps.length - 1;
    backBtnEl.style.visibility = currentIndex === 0 ? "hidden" : "visible";

    nextBtnEl.disabled = !isCurrentStepValid();
    if (currentStepKey === "base" && state.baseType === "single") {
      nextBtnEl.textContent = "Kosárba";
    } else if (isLast) {
      nextBtnEl.textContent =
        state.baseType === "menu" ? "Befejezés" : "Kosárba";
    } else {
      nextBtnEl.textContent = "Tovább";
    }
  }

  function renderAll() {
    renderProgress();
    renderSummary();
    renderContent();
    renderFooter();
  }

  function showToast(type, message) {
    const el = document.createElement("div");
    el.className = `alert alert-${type} position-fixed top-0 end-0 m-3 shadow`;
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
      if (state.baseType === "single") {
        await addConfiguredBurgerToCart(null);

        if (modalInstance) {
          modalInstance.hide();
        }

        return;
      }

      const menuConfig = {
        baseType: "menu",
        sideType: state.sideType,
        extraType: state.extraType,
        sauceId:
          state.extraType === "sauce" ? Number(state.sauceId || 0) : null,
      };

      await addConfiguredBurgerToCart(menuConfig);

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

    if (currentStepKey === "base" && state.baseType === "single") {
      handleFinish();
      return;
    }

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
          state.sideType = null;
          state.extraType = null;
          state.sauceId = null;
        }
      }

      if (kind === "side") {
        state.sideType = value;
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
    document.addEventListener("DOMContentLoaded", () => {
      injectMarkup();
      cacheRefs();
      bindEvents();
    });
  } else {
    injectMarkup();
    cacheRefs();
    bindEvents();
  }
})();
