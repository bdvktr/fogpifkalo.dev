document.addEventListener("DOMContentLoaded", () => {
  const adminError = document.getElementById("adminError");
  const adminContent = document.getElementById("adminContent");
  const productsList = document.getElementById("productsList");
  const ordersAdminList = document.getElementById("ordersAdminList");
  const newProductForm = document.getElementById("newProductForm");
  const editProductModalEl = document.getElementById("editProductModal");
  const editProductForm = document.getElementById("editProductForm");
  const editProductIdInput = document.getElementById("editProductId");
  const editProductNameInput = document.getElementById("editProductName");
  const editProductDescriptionInput = document.getElementById(
    "editProductDescription",
  );
  const editProductPriceInput = document.getElementById("editProductPrice");
  const editProductImageUrlInput = document.getElementById(
    "editProductImageUrl",
  );
  const editProductCategorySelect = document.getElementById(
    "editProductCategory",
  );
  const reservationsAdminList = document.getElementById(
    "reservationsAdminList",
  );
  const newProductIsSpecialOfferInput = document.getElementById(
    "newProductIsSpecialOffer",
  );
  const editProductIsSpecialOfferInput = document.getElementById(
    "editProductIsSpecialOffer",
  );

  // Új termék kép feltöltés (drag & drop)
  const newProductImageUrlInput = document.getElementById("newProductImageUrl");
  const newImageDropZone = document.getElementById("newImageDropZone");
  const newImageFileInput = document.getElementById("newImageFileInput");
  const newImageBrowseTrigger = document.getElementById(
    "newImageBrowseTrigger",
  );
  const newImageUploadStatus = document.getElementById("newImageUploadStatus");
  const newImagePreview = document.getElementById("newImagePreview");

  // Szerkesztés kép feltöltés (drag & drop)
  const editImageDropZone = document.getElementById("editImageDropZone");
  const editImageFileInput = document.getElementById("editImageFileInput");
  const editImageBrowseTrigger = document.getElementById(
    "editImageBrowseTrigger",
  );
  const editImageUploadStatus = document.getElementById(
    "editImageUploadStatus",
  );
  const editImagePreview = document.getElementById("editImagePreview");

  // Toast elemek
  const toastEl = document.getElementById("adminToast");
  const toastTextEl = document.getElementById("adminToastText");
  let toastInstance;

  if (toastEl && typeof bootstrap !== "undefined") {
    toastInstance = new bootstrap.Toast(toastEl);
  }

  // Confirm modal elemek
  const confirmModalEl = document.getElementById("confirmModal");
  const confirmModalMessageEl = document.getElementById("confirmModalMessage");
  const confirmModalConfirmBtn = document.getElementById(
    "confirmModalConfirmBtn",
  );
  let confirmModal;
  if (confirmModalEl && typeof bootstrap !== "undefined") {
    confirmModal = new bootstrap.Modal(confirmModalEl);
  }

  let editProductModal;
  if (editProductModalEl && typeof bootstrap !== "undefined") {
    editProductModal = new bootstrap.Modal(editProductModalEl);
  }

  const orderDetailsModalEl = document.getElementById("orderDetailsModal");
  const orderDetailsTitle = document.getElementById("orderDetailsTitle");
  const orderDetailsBody = document.getElementById("orderDetailsBody");

  const adminLogsList = document.getElementById("adminLogsList");

  let orderDetailsModal;
  if (orderDetailsModalEl && typeof bootstrap !== "undefined") {
    orderDetailsModal = new bootstrap.Modal(orderDetailsModalEl);
  }

  // Ingredients UI (új + szerkesztés)
  const newIngredientsWrap = document.getElementById("newIngredientsWrap");
  const newIngredientsAddBtn = document.getElementById("newIngredientsAddBtn");

  const editIngredientsWrap = document.getElementById("editIngredientsWrap");
  const editIngredientsAddBtn = document.getElementById(
    "editIngredientsAddBtn",
  );

  // Kis helper az Ft formázáshoz
  function formatFt(value) {
    return Math.round(Number(value)).toLocaleString("hu-HU");
  }

  function getBurgerConfigLines(config) {
    if (!config || config.baseType !== "menu") {
      return [];
    }

    const lines = ["Menü"];

    if (config.sideType === "crispers") {
      lines.push("Köret: Crispers");
    } else if (config.sideType === "sweet_potato") {
      lines.push("Köret: Édesburgonya");
    }

    if (config.extraType === "coleslaw") {
      lines.push("Kiegészítő: Coleslaw saláta");
    } else if (config.extraType === "sauce") {
      lines.push("Kiegészítő: Szósz");
      if (config.sauceName) {
        lines.push(`Szósz: ${config.sauceName}`);
      }
    }

    return lines;
  }

  function renderBurgerConfigTableHtml(config) {
    const lines = getBurgerConfigLines(config);
    if (lines.length === 0) {
      return "";
    }

    return `
    <div class="text-muted small mt-1">
      ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
    </div>
  `;
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

  function showError(message) {
    if (!adminError) return;
    adminError.textContent = message;
    adminError.classList.remove("d-none");
    adminContent.classList.add("d-none");
  }

  // =========================
  // Ingredients editor helper
  // =========================
  function createIngredientRow(initialValue = "") {
    const row = document.createElement("div");
    row.className = "input-group input-group-sm";

    row.innerHTML = `
      <input type="text" class="form-control ingredient-input mb-2" placeholder="pl. Bacon" />
      <button class="btn btn-outline-danger ingredient-remove-btn mb-2" type="button" title="Törlés">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    const input = row.querySelector(".ingredient-input");
    input.value = initialValue;

    // Enter -> új sor (ha van hozzá add gomb), vagy csak blur
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    return row;
  }

  function collectIngredientsFromWrap(wrapEl) {
    if (!wrapEl) return [];
    const inputs = wrapEl.querySelectorAll("input.ingredient-input");
    return Array.from(inputs)
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  function setIngredientsToWrap(wrapEl, arr) {
    if (!wrapEl) return;
    wrapEl.innerHTML = "";
    (arr || []).forEach((v) => wrapEl.appendChild(createIngredientRow(v)));
  }

  function wireIngredientsEditor({ wrapEl, addBtnEl }) {
    if (!wrapEl || !addBtnEl) return;

    // + gomb -> új sor, fókusz
    addBtnEl.addEventListener("click", () => {
      const row = createIngredientRow("");
      wrapEl.appendChild(row);
      const input = row.querySelector("input.ingredient-input");
      if (input) input.focus();
    });

    // törlés delegálva
    wrapEl.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".ingredient-remove-btn");
      if (!removeBtn) return;
      const row = removeBtn.closest(".input-group");
      if (row) row.remove();
    });
  }

  // Bekötjük a két editor instance-t
  wireIngredientsEditor({
    wrapEl: newIngredientsWrap,
    addBtnEl: newIngredientsAddBtn,
  });
  wireIngredientsEditor({
    wrapEl: editIngredientsWrap,
    addBtnEl: editIngredientsAddBtn,
  });

  // Toast helper
  function showToast(message, type = "success") {
    if (!toastEl || !toastTextEl || typeof bootstrap === "undefined") {
      console.log(`[${type}]`, message);
      return;
    }

    toastTextEl.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;

    if (!toastInstance) {
      toastInstance = new bootstrap.Toast(toastEl);
    }

    toastInstance.show();
  }

  // Confirm helper – Promise-t ad vissza (true/false)
  function showConfirm(message) {
    return new Promise((resolve) => {
      if (
        !confirmModal ||
        !confirmModalMessageEl ||
        !confirmModalConfirmBtn ||
        typeof bootstrap === "undefined"
      ) {
        const result = window.confirm(message);
        resolve(result);
        return;
      }

      confirmModalMessageEl.textContent = message;

      const handleConfirm = () => {
        cleanup();
        resolve(true);
        confirmModal.hide();
      };

      const handleHidden = () => {
        cleanup();
        resolve(false);
      };

      function cleanup() {
        confirmModalConfirmBtn.removeEventListener("click", handleConfirm);
        confirmModalEl.removeEventListener("hidden.bs.modal", handleHidden);
      }

      confirmModalConfirmBtn.addEventListener("click", handleConfirm, {
        once: true,
      });
      confirmModalEl.addEventListener("hidden.bs.modal", handleHidden, {
        once: true,
      });

      confirmModal.show();
    });
  }

  function setupImageUpload({
    dropZone,
    fileInput,
    browseTrigger,
    statusEl,
    previewImg,
  }) {
    if (!dropZone || !fileInput) {
      return {
        getSelectedFile: () => null,
        clearSelectedFile: () => {},
      };
    }

    let selectedFile = null;

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => dropZone.classList.add("bg-light"),
        false,
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => dropZone.classList.remove("bg-light"),
        false,
      );
    });

    dropZone.addEventListener("click", () => fileInput.click());

    if (browseTrigger) {
      browseTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        handleSelectedFile(file);
      }
    });

    dropZone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const file = dt.files && dt.files[0];
      if (file) {
        handleSelectedFile(file);
      }
    });

    function handleSelectedFile(file) {
      if (!file.type.startsWith("image/")) {
        selectedFile = null;
        if (statusEl) statusEl.textContent = "Csak képfájlt tölthetsz fel.";
        if (previewImg) {
          previewImg.classList.add("d-none");
          previewImg.src = "";
        }
        return;
      }

      selectedFile = file;
      if (statusEl) statusEl.textContent = `Kiválasztott fájl: ${file.name}`;

      if (previewImg) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          previewImg.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
      }
    }

    return {
      getSelectedFile() {
        return selectedFile;
      },
      clearSelectedFile() {
        selectedFile = null;
        if (statusEl) statusEl.textContent = "";
        if (previewImg) {
          previewImg.classList.add("d-none");
          previewImg.src = "";
        }
        fileInput.value = "";
      },
    };
  }

  const newImageUpload = setupImageUpload({
    dropZone: newImageDropZone,
    fileInput: newImageFileInput,
    browseTrigger: newImageBrowseTrigger,
    statusEl: newImageUploadStatus,
    previewImg: newImagePreview,
  });

  const editImageUpload = setupImageUpload({
    dropZone: editImageDropZone,
    fileInput: editImageFileInput,
    browseTrigger: editImageBrowseTrigger,
    statusEl: editImageUploadStatus,
    previewImg: editImagePreview,
  });

  // 🔹 1. Auth + admin ellenőrzés
  async function checkAdmin() {
    try {
      const res = await apiFetch("/api/me/admin");
      const data = await res.json();

      if (adminContent) adminContent.classList.remove("d-none");

      // Betöltjük a termékeket + rendeléseket
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadReservations(),
        loadAdminLogs(),
      ]);
    } catch (err) {
      console.error("Hiba az /api/me/admin ellenőrzésnél:", err);
      showError("Nem sikerült csatlakozni a szerverhez.");
    }
  }

  // 🔹 2. Termékek betöltése
  async function loadProducts() {
    if (!productsList) return;
    productsList.textContent = "Termékek betöltése...";

    try {
      const res = await apiFetch("/api/admin/products");
      const data = await res.json();

      if (!data.success) {
        productsList.textContent =
          data.message || "Nem sikerült betölteni a termékeket.";
        return;
      }

      const products = data.products || [];

      if (products.length === 0) {
        productsList.textContent = "Még nincsenek termékek az adatbázisban.";
        return;
      }

      productsList.innerHTML = "";
      products.forEach((p) => {
        const isActive = Number(p.is_active) === 1;
        const isSpecialOffer = Number(p.is_special_offer) === 1;

        const wrapper = document.createElement("div");
        wrapper.className =
          "d-flex justify-content-between align-items-center border rounded p-2 mb-2";

        wrapper.innerHTML = `
        <div>
          <strong>${escapeHtml(p.name)}</strong>
          <div class="text-muted small clamp-2">${escapeHtml(p.description || "")}</div>
          <div class="small fw-semibold">${formatFt(p.price)} Ft</div>
          ${
            !isActive
              ? '<div class="badge bg-secondary mt-1">Inaktív</div>'
              : ""
          }
          ${
            isSpecialOffer
              ? '<div class="badge bg-warning text-dark mt-1">Hétvégi ajánlat</div>'
              : ""
          }
        </div>
        <div class="text-end d-flex justify-content-end gap-1 flex-shrink-0 align-self-start">
          <button 
            class="btn btn-sm btn-outline-secondary me-1 admin-edit-product-btn"
            data-product-id="${escapeAttr(p.id)}"
            data-name="${escapeAttr(p.name || "")}"
            data-description="${escapeAttr(p.description || "")}"
              data-ingredients="${escapeAttr(
                p.ingredients ? JSON.stringify(p.ingredients) : "[]",
              )}"
            data-price="${p.price}"
            data-image-url="${escapeAttr(p.image_url || "")}"
            data-category="${escapeAttr(p.category || "burger")}"
            data-is-special-offer="${escapeAttr(Number(p.is_special_offer) === 1 ? "1" : "0")}"

            title="Szerkesztés"
          >
            <i class="bi bi-pencil"></i>
          </button>

          ${
            isActive
              ? `
            <button 
              class="btn btn-sm btn-outline-danger admin-delete-product-btn"
              data-product-id="${escapeAttr(p.id)}"
              title="Törlés"
            >
              <i class="bi bi-trash"></i>
            </button>`
              : `
            <button 
              class="btn btn-sm btn-outline-success admin-activate-product-btn"
              data-product-id="${escapeAttr(p.id)}"
              title="Újraaktiválás"
            >
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>`
          }
        </div>
      `;

        productsList.appendChild(wrapper);
      });
    } catch (err) {
      console.error("Hiba a /api/admin/products hívásnál:", err);
      productsList.textContent =
        "Nem sikerült csatlakozni a szerverhez (termékek).";
    }
  }

  // 🔹 3. Új termék hozzáadása
  if (newProductForm) {
    newProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(newProductForm);
      const name = formData.get("name");
      const description = formData.get("description");
      const price = formData.get("price");
      const ingredients = collectIngredientsFromWrap(newIngredientsWrap);
      let image_url = formData.get("image_url");
      const category = formData.get("category") || "burger";
      const is_special_offer = formData.get("is_special_offer") === "on";

      // Ha van feltöltött kép, először azt küldjük fel Multerrel
      const newFile = newImageUpload.getSelectedFile
        ? newImageUpload.getSelectedFile()
        : null;

      if (newFile) {
        const uploadedUrl = await uploadImageFile(
          newFile,
          newImageUploadStatus,
        );
        if (!uploadedUrl) {
          // hibáról már szóltunk toastban, ne menjünk tovább
          return;
        }
        image_url = uploadedUrl;
        if (newProductImageUrlInput) {
          newProductImageUrlInput.value = image_url;
        }
      }

      if (!name || !price) {
        showToast("A név és az ár megadása kötelező.", "warning");
        return;
      }

      try {
        const res = await apiFetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            ingredients,
            price: Number(price),
            image_url,
            category,
            is_special_offer,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Termék sikeresen hozzáadva.", "success");
          newProductForm.reset();
          setIngredientsToWrap(newIngredientsWrap, []);
          await loadProducts();
          if (newImageUpload && newImageUpload.clearSelectedFile) {
            newImageUpload.clearSelectedFile();
          }
        } else {
          showToast(
            data.message || "Nem sikerült létrehozni a terméket.",
            "danger",
          );
        }
      } catch (err) {
        console.error("Hiba a termék hozzáadásánál:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      }
    });
  }

  // 🔹 4. Termék szerkesztése / Törlése
  if (productsList) {
    productsList.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".admin-delete-product-btn");
      const activateBtn = e.target.closest(".admin-activate-product-btn");
      const editBtn = e.target.closest(".admin-edit-product-btn");

      // 🔹 Inaktiválás (soft delete)
      if (deleteBtn) {
        const productId = deleteBtn.dataset.productId;
        if (!productId) return;

        const ok = await showConfirm("Biztosan inaktiválod ezt a terméket?");
        if (!ok) return;

        try {
          const res = await apiFetch(`/api/admin/products/${productId}`, {
            method: "DELETE",
          });
          const data = await res.json();

          if (data.success) {
            showToast("Termék inaktiválva.", "success");
            await loadProducts();
          } else {
            showToast(
              data.message || "Nem sikerült inaktiválni a terméket.",
              "danger",
            );
          }
        } catch (err) {
          console.error("Hiba a termék törlésekor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      // 🔹 Újraaktiválás
      if (activateBtn) {
        const productId = activateBtn.dataset.productId;
        if (!productId) return;

        const ok = await showConfirm("Biztosan újraaktiválod ezt a terméket?");
        if (!ok) return;

        try {
          const res = await apiFetch(
            `/api/admin/products/${productId}/activate`,
            {
              method: "PUT",
            },
          );
          const data = await res.json();

          if (data.success) {
            showToast("Termék újraaktiválva.", "success");
            await loadProducts();
          } else {
            showToast(
              data.message || "Nem sikerült aktiválni a terméket.",
              "danger",
            );
          }
        } catch (err) {
          console.error("Hiba a termék aktiválásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      // 🔹 Szerkesztés
      if (editBtn && editProductModal && editProductForm) {
        const productId = editBtn.dataset.productId;
        const name = editBtn.dataset.name || "";
        const description = editBtn.dataset.description || "";
        let ingredients = [];
        try {
          ingredients = editBtn.dataset.ingredients
            ? JSON.parse(editBtn.dataset.ingredients)
            : [];
        } catch (err) {
          ingredients = [];
        }
        setIngredientsToWrap(
          editIngredientsWrap,
          Array.isArray(ingredients) ? ingredients : [],
        );
        const price = editBtn.dataset.price || "";
        const imageUrl = editBtn.dataset.imageUrl || "";
        const category = editBtn.dataset.category || "burger";
        const isSpecialOffer = editBtn.dataset.isSpecialOffer === "1";

        editProductIdInput.value = productId;
        editProductNameInput.value = name;
        editProductDescriptionInput.value = description;
        editProductPriceInput.value = price;
        editProductImageUrlInput.value = imageUrl;

        if (editProductCategorySelect) {
          editProductCategorySelect.value = category;
        }
        if (editProductIsSpecialOfferInput) {
          editProductIsSpecialOfferInput.checked = isSpecialOffer;
        }

        editProductModal.show();
      }
    });
  }

  // 🔹 Termék szerkesztésének mentése
  if (editProductForm) {
    editProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = editProductIdInput.value;
      const name = editProductNameInput.value.trim();
      const description = editProductDescriptionInput.value.trim();
      const price = editProductPriceInput.value;
      const ingredients = collectIngredientsFromWrap(editIngredientsWrap);
      let image_url = editProductImageUrlInput.value.trim();
      const category = editProductCategorySelect
        ? editProductCategorySelect.value
        : "burger";
      const is_special_offer = Boolean(
        editProductIsSpecialOfferInput &&
        editProductIsSpecialOfferInput.checked,
      );

      console.log("EDIT SUBMIT is_special_offer:", is_special_offer);

      // Ha szerkesztéskor új képet választottunk, töltsük fel Multerrel
      const editFile = editImageUpload.getSelectedFile
        ? editImageUpload.getSelectedFile()
        : null;

      if (editFile) {
        const uploadedUrl = await uploadImageFile(
          editFile,
          editImageUploadStatus,
        );
        if (!uploadedUrl) {
          return;
        }
        image_url = uploadedUrl;
        if (editProductImageUrlInput) {
          editProductImageUrlInput.value = image_url;
        }
      }

      if (!id || !name || !price) {
        showToast("A név és az ár megadása kötelező.", "warning");
        return;
      }

      try {
        const res = await apiFetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            ingredients,
            price: Number(price),
            image_url,
            category,
            is_special_offer,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Termék frissítve.", "success");
          editProductModal.hide();
          await loadProducts();
          if (editImageUpload && editImageUpload.clearSelectedFile) {
            editImageUpload.clearSelectedFile();
          }
        } else {
          showToast(
            data.message || "Nem sikerült frissíteni a terméket.",
            "danger",
          );
        }
      } catch (err) {
        console.error("Hiba a termék frissítésekor:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      }
    });
  }

  // 🔹 5. Rendelések betöltése
  async function loadOrders() {
    if (!ordersAdminList) return;

    ordersAdminList.textContent = "Rendelések betöltése...";

    try {
      const res = await apiFetch("/api/admin/orders");
      const data = await res.json();

      if (!data.success) {
        ordersAdminList.textContent =
          data.message || "Nem sikerült betölteni a rendeléseket.";
        return;
      }

      const orders = data.orders || [];

      if (orders.length === 0) {
        ordersAdminList.textContent = "Még nincsenek leadott rendelések.";
        return;
      }

      // 🔹 Szétválogatjuk státusz szerint
      const pendingOrders = orders.filter((o) => o.status === "pending");
      const completedOrders = orders.filter((o) => o.status === "completed");
      const cancelledOrders = orders.filter((o) => o.status === "cancelled");

      // 🔹 Konténer kiürítése
      ordersAdminList.innerHTML = "";

      function renderSection(title, list, emptyText) {
        const section = document.createElement("div");
        section.className = "mb-4";

        const heading = document.createElement("h3");
        heading.className = "h6 mb-2";
        heading.textContent = title;
        section.appendChild(heading);

        const container = document.createElement("div");
        container.className = "small";
        section.appendChild(container);

        if (!list || list.length === 0) {
          container.textContent = emptyText;
        } else {
          list.forEach((o) => {
            const wrapper = document.createElement("div");
            wrapper.className = "border rounded p-2 mb-2";

            const createdAt = new Date(o.created_at);
            const formattedDate = createdAt.toLocaleString("hu-HU");

            let statusText = "";
            let badgeClass = "";

            switch (o.status) {
              case "pending":
                statusText = "Folyamatban";
                badgeClass = "bg-warning text-dark";
                break;

              case "completed":
                statusText = "Teljesítve";
                badgeClass = "bg-success";
                break;

              case "cancelled":
                statusText = "Törölve";
                badgeClass = "bg-danger";
                break;

              default:
                statusText = o.status;
                badgeClass = "bg-secondary";
            }

            wrapper.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
              <div>
                <strong>Rendelés #${o.id}</strong>
                <div class="text-muted small">${escapeHtml(formattedDate)}</div>
                <div class="text-muted small">Vevő: ${escapeHtml(o.user_email)}</div>
              </div>
              <div class="text-end" style="min-width: 190px;">
                <div class="mb-1">
                  <span class="badge ${badgeClass}">${escapeHtml(statusText)}</span>
                </div>
                <select 
                  class="form-select form-select-sm admin-order-status mb-1"
                  data-order-id="${escapeAttr(o.id)}"
                  data-original-status="${escapeAttr(o.status)}"
                >
                  <option value="pending"   ${
                    o.status === "pending" ? "selected" : ""
                  }>Folyamatban</option>
                  <option value="completed" ${
                    o.status === "completed" ? "selected" : ""
                  }>Teljesítve</option>
                  <option value="cancelled" ${
                    o.status === "cancelled" ? "selected" : ""
                  }>Törölve</option>
                </select>

                <div class="d-flex justify-content-between align-items-center mt-1">
                  <span class="fw-semibold">${formatFt(o.total_price)} Ft</span>
                  <button 
                    type="button"
                    class="btn btn-sm btn-outline-primary ms-2 admin-order-details-btn"
                    data-order-id="${escapeAttr(o.id)}"
                  >
                    Részletek
                  </button>
                </div>
              </div>
            </div>
          `;

            container.appendChild(wrapper);
          });
        }

        ordersAdminList.appendChild(section);
      }

      // 🔹 Három blokk egymás alatt
      renderSection(
        "Folyamatban",
        pendingOrders,
        "Nincs folyamatban lévő rendelés.",
      );
      renderSection(
        "Teljesítve",
        completedOrders,
        "Nincs teljesített rendelés.",
      );
      renderSection("Törölve", cancelledOrders, "Nincs törölt rendelés.");
    } catch (err) {
      console.error("Hiba a /api/admin/orders hívásnál:", err);
      ordersAdminList.textContent =
        "Nem sikerült csatlakozni a szerverhez (rendelések).";
    }
  }

  // 🔹 6. Asztalfoglalások betöltése
  async function loadReservations() {
    if (!reservationsAdminList) return;

    reservationsAdminList.textContent = "Foglalások betöltése...";

    try {
      const res = await apiFetch("/api/admin/reservations");
      const data = await res.json();

      if (!data.success) {
        reservationsAdminList.textContent =
          data.message || "Nem sikerült betölteni a foglalásokat.";
        return;
      }

      const reservations = data.reservations || [];

      if (reservations.length === 0) {
        reservationsAdminList.textContent = "Még nincsenek foglalások.";
        return;
      }

      const pending = reservations.filter((r) => r.status === "pending");
      const confirmed = reservations.filter((r) => r.status === "confirmed");
      const cancelled = reservations.filter((r) => r.status === "cancelled");

      reservationsAdminList.innerHTML = "";

      function formatDateAndTimeRange(r) {
        let datePart = "";
        let timeFrom = "";
        let timeTo = "";

        // Dátum normalizálás (lehet string "YYYY-MM-DD" vagy Date)
        if (r.reservation_date) {
          const d = new Date(r.reservation_date);
          datePart = d.toLocaleDateString("hu-HU");
        }

        // Kezdő idő (reservation_time)
        if (typeof r.reservation_time === "string") {
          timeFrom = r.reservation_time.slice(0, 5); // "HH:MM"
        } else if (r.reservation_time instanceof Date) {
          timeFrom = r.reservation_time.toTimeString().slice(0, 5);
        }

        // Vég idő (end_time) – ha nincs, fallback: +2 óra
        if (r.end_time) {
          if (typeof r.end_time === "string") {
            timeTo = r.end_time.slice(0, 5);
          } else if (r.end_time instanceof Date) {
            timeTo = r.end_time.toTimeString().slice(0, 5);
          }
        } else {
          // régi foglalás – számoljunk +2 órát
          const tmpStart = new Date(`${datePart}T${timeFrom}:00`);
          if (!isNaN(tmpStart.getTime())) {
            const tmpEndMs = tmpStart.getTime() + 120 * 60 * 1000;
            const tmpEnd = new Date(tmpEndMs);
            timeTo = tmpEnd.toTimeString().slice(0, 5);
          }
        }

        let dateLabel = "";
        try {
          const d = new Date(`${datePart}T00:00:00`);
          if (!isNaN(d.getTime())) {
            dateLabel = d.toLocaleDateString("hu-HU", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });
          } else {
            dateLabel = datePart;
          }
        } catch (e) {
          dateLabel = datePart;
        }

        const timeRange =
          timeFrom && timeTo ? `${timeFrom}–${timeTo}` : timeFrom || "";

        return {
          dateLabel,
          timeRange,
        };
      }

      function renderSection(title, list, emptyText) {
        const section = document.createElement("div");
        section.className = "mb-4";

        const heading = document.createElement("h3");
        heading.className = "h6 mb-2";
        heading.textContent = title;
        section.appendChild(heading);

        const container = document.createElement("div");
        container.className = "small";
        section.appendChild(container);

        if (!list || list.length === 0) {
          container.textContent = emptyText;
        } else {
          list.forEach((r) => {
            const wrapper = document.createElement("div");
            wrapper.className = "border rounded p-2 mb-2";

            const { dateLabel, timeRange } = formatDateAndTimeRange(r);

            wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div><strong>${escapeHtml(dateLabel)}${
                  timeRange ? " • " + timeRange : ""
                }</strong></div>
                <div>Asztal: <strong>${r.table_number}.</strong> • ${
                  r.people_count
                } fő</div>
                <div>${escapeHtml(r.name)} – ${escapeHtml(r.phone)}</div>
                ${
                  r.note
                    ? `<div class="text-muted small mt-1">Megjegyzés: ${escapeHtml(r.note)}</div>`
                    : ""
                }
              </div>
              <div class="text-end">
                <div class="mb-1">
                  ${
                    r.status === "pending"
                      ? '<span class="badge bg-warning text-dark">Függőben</span>'
                      : r.status === "confirmed"
                        ? '<span class="badge bg-success">Megerősítve</span>'
                        : '<span class="badge bg-secondary">Lemondva</span>'
                  }
                </div>
                <div>
                  ${
                    r.status === "pending"
                      ? `
                    <button 
                      class="btn btn-sm btn-outline-success me-1 admin-reservation-confirm-btn"
                      data-reservation-id="${escapeAttr(r.id)}"
                    >
                      Jóváhagyás
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-danger admin-reservation-cancel-btn"
                      data-reservation-id="${escapeAttr(r.id)}"
                    >
                      Lemondás
                    </button>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          `;

            container.appendChild(wrapper);
          });
        }

        reservationsAdminList.appendChild(section);
      }

      renderSection(
        "Függőben lévő foglalások",
        pending,
        "Nincs függőben lévő foglalás.",
      );
      renderSection(
        "Megerősített foglalások",
        confirmed,
        "Nincs megerősített foglalás.",
      );
      renderSection(
        "Lemondott foglalások",
        cancelled,
        "Nincs lemondott foglalás.",
      );
    } catch (err) {
      console.error("Hiba a /api/admin/reservations hívásnál:", err);
      reservationsAdminList.textContent =
        "Nem sikerült csatlakozni a szerverhez (foglalások).";
    }
  }

  // 🔹 7. Admin log betöltése (read-only)
  async function loadAdminLogs() {
    const detailLabels = {
      name: "Név",
      price: "Ár",
      category: "Kategória",
      is_active: "Aktív",
      newStatus: "Új státusz",
      oldStatus: "Régi státusz",
      description: "Leírás",
      is_special_offer: "Hétvégi ajánlat",
    };

    const statusTranslations = {
      completed: "teljesítve",
      cancelled: "törölve",
      pending: "függőben",
      confirmed: "megerősítve",
      preparing: "készítés alatt",
      delivered: "kiszállítva",
    };

    const entityTranslations = {
      product: "termék",
      order: "rendelés",
      reservation: "foglalás",
    };

    const statusIcons = {
      completed: "🟢",
      cancelled: "🔴",
      pending: "🟡",
      preparing: "🟠",
      confirmed: "🔵",
      delivered: "📦",
    };

    if (!adminLogsList) return;

    adminLogsList.textContent = "Admin log betöltése...";

    try {
      const res = await apiFetch("/api/admin/logs");
      const data = await res.json();

      if (!data.success) {
        adminLogsList.textContent =
          data.message || "Nem sikerült betölteni az admin logot.";
        return;
      }

      const logs = data.logs || [];

      if (logs.length === 0) {
        adminLogsList.textContent = "Még nincsenek log bejegyzések.";
        return;
      }

      adminLogsList.innerHTML = "";

      logs.forEach((log) => {
        const wrapper = document.createElement("div");
        wrapper.className = "border rounded p-2 mb-2";

        const dateLabel = log.created_at
          ? new Date(log.created_at).toLocaleString("hu-HU")
          : "";

        const adminLabel =
          log.admin_name || log.admin_email || "Ismeretlen admin";

        let detailsData = null;

        if (log.details_json) {
          try {
            const parsed =
              typeof log.details_json === "string"
                ? JSON.parse(log.details_json)
                : log.details_json;

            detailsData = parsed; // ❗ OBJEKTUM marad, nem string!
          } catch {
            detailsData = null;
          }
        }

        const entityLabel =
          entityTranslations[log.entity_type] || log.entity_type || "-";
        const entityDisplay = `${entityLabel}${
          log.entity_id ? " #" + log.entity_id : ""
        }`;

        wrapper.innerHTML = `
          <div class="d-flex justify-content-between">
            <div>
              <div><strong>${escapeHtml(log.action)}</strong></div>
              <div class="text-muted small">
                Admin: ${escapeHtml(adminLabel)}
              </div>
              <div class="text-muted small">
              Entitás: ${escapeHtml(entityDisplay)}
            </div>
            ${(detailsData &&
            typeof detailsData === "object" &&
            !Array.isArray(detailsData)
              ? Object.entries(detailsData)
              : []
            )
              .map(([key, val]) => {
                const label = detailLabels[key] || key;

                // Státusz magyarítása
                const translatedVal =
                  typeof val === "string" && statusTranslations[val]
                    ? statusTranslations[val]
                    : val;

                // Státusz ikon
                const icon =
                  typeof val === "string" && statusIcons[val]
                    ? statusIcons[val] + " "
                    : "";

                // Ár formázása
                if (key === "price") {
                  return `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(translatedVal)} Ft</li>`;
                }

                // Boolean (1/0) formázás
                if (val === 1 || val === 0) {
                  return `<li><strong>${escapeHtml(label)}:</strong> ${
                    val === 1 ? "igen" : "nem"
                  }</li>`;
                }

                // Boolean (true/false) formázás
                if (val === true || val === false) {
                  return `<li><strong>${escapeHtml(label)}:</strong> ${
                    val ? "igen" : "nem"
                  }</li>`;
                }

                return `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(icon)}${escapeHtml(translatedVal)}</li>`;
              })
              .join("")}
            </div>
            <div class="text-end small text-muted">
              ${escapeHtml(dateLabel)}
            </div>
          </div>
        `;

        adminLogsList.appendChild(wrapper);
      });
    } catch (err) {
      console.error("Hiba az admin log betöltésekor:", err);
      adminLogsList.textContent =
        "Nem sikerült csatlakozni a szerverhez (admin log).";
    }
  }

  // 🔹 Foglalások státuszának módosítása (Jóváhagyás / Lemondás)
  if (reservationsAdminList) {
    reservationsAdminList.addEventListener("click", async (e) => {
      const confirmBtn = e.target.closest(".admin-reservation-confirm-btn");
      const cancelBtn = e.target.closest(".admin-reservation-cancel-btn");

      if (confirmBtn) {
        const id = confirmBtn.dataset.reservationId;
        if (!id) return;

        const ok = await showConfirm("Biztosan jóváhagyod ezt a foglalást?");
        if (!ok) return;

        try {
          const res = await apiFetch(`/api/admin/reservations/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "confirmed" }),
          });

          const data = await res.json();

          if (data.success) {
            showToast("Foglalás jóváhagyva.", "success");
            await loadReservations();
          } else {
            showToast(
              data.message || "Nem sikerült módosítani a foglalás státuszát.",
              "danger",
            );
          }
        } catch (err) {
          console.error("Hiba a foglalás jóváhagyásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }

      if (cancelBtn) {
        const id = cancelBtn.dataset.reservationId;
        if (!id) return;

        const ok = await showConfirm("Biztosan lemondod ezt a foglalást?");
        if (!ok) return;

        try {
          const res = await apiFetch(`/api/admin/reservations/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "cancelled" }),
          });

          const data = await res.json();

          if (data.success) {
            showToast("Foglalás lemondva.", "success");
            await loadReservations();
          } else {
            showToast(
              data.message || "Nem sikerült módosítani a foglalás státuszát.",
              "danger",
            );
          }
        } catch (err) {
          console.error("Hiba a foglalás lemondásakor:", err);
          showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        }

        return;
      }
    });
  }

  // 🔹 Rendelés státusz váltása (event delegation)
  if (ordersAdminList) {
    ordersAdminList.addEventListener("change", async (e) => {
      const select = e.target.closest(".admin-order-status");
      if (!select) return;

      const orderId = select.dataset.orderId;
      const newStatus = select.value;
      const originalStatus = select.dataset.originalStatus || newStatus;

      if (!orderId || !newStatus) return;

      // Magyar szöveg a státuszhoz (a modal üzenethez)
      let statusTextHu = "";
      switch (newStatus) {
        case "pending":
          statusTextHu = "Folyamatban";
          break;
        case "completed":
          statusTextHu = "Teljesítve";
          break;
        case "cancelled":
          statusTextHu = "Törölve";
          break;
        default:
          statusTextHu = newStatus;
      }

      const ok = await showConfirm(
        `Biztosan módosítod a rendelés státuszát erre: "${statusTextHu}"?`,
      );

      if (!ok) {
        // Ha mégse, állítsuk vissza a selectet az eredeti értékre
        select.value = originalStatus;
        return;
      }

      try {
        const res = await apiFetch(`/api/admin/orders/${orderId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Rendelés státusza frissítve.", "success");
          // Siker esetén frissítjük az "eredeti" státuszt is
          select.dataset.originalStatus = newStatus;
          await loadOrders();
        } else {
          showToast(
            data.message || "Nem sikerült frissíteni a státuszt.",
            "danger",
          );
          // Ha szerver hiba, állítsuk vissza a régire
          select.value = originalStatus;
        }
      } catch (err) {
        console.error("Hiba a rendelés státusz módosításakor:", err);
        showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
        // Hiba esetén is visszaállítjuk a selectet
        select.value = originalStatus;
      }
    });
  }

  // 🔹 Rendelés részletek megnyitása
  if (ordersAdminList) {
    ordersAdminList.addEventListener("click", async (e) => {
      const btn = e.target.closest(".admin-order-details-btn");
      if (!btn || !orderDetailsModal || !orderDetailsBody) return;

      const orderId = btn.dataset.orderId;
      if (!orderId) return;

      // Alapértelmezett szöveg a modalban
      orderDetailsTitle.textContent = `Rendelés #${orderId} – részletek`;
      orderDetailsBody.innerHTML = `<div class="text-muted small">Részletek betöltése...</div>`;
      orderDetailsModal.show();

      try {
        const res = await apiFetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();

        if (!data.success) {
          orderDetailsBody.innerHTML = `
          <div class="alert alert-danger small mb-0">
            ${escapeHtml(data.message || "Nem sikerült betölteni a rendelés részleteit.")}
          </div>
        `;
          return;
        }

        const order = data.order;
        const createdAt = new Date(order.created_at);
        const formattedDate = createdAt.toLocaleString("hu-HU");

        let statusText = "";
        switch (order.status) {
          case "pending":
            statusText = "Folyamatban";
            break;
          case "completed":
            statusText = "Teljesítve";
            break;
          case "cancelled":
            statusText = "Törölve";
            break;
          default:
            statusText = order.status;
        }

        // Fejléc infók
        const headerHtml = `
        <div class="mb-3">
          <div><strong>Rendelés azonosító:</strong> #${order.id}</div>
          <div><strong>Dátum:</strong> ${escapeHtml(formattedDate)}</div>
          <div><strong>Státusz:</strong> ${escapeHtml(statusText)}</div>
          <div><strong>Vevő:</strong> ${escapeHtml(order.user.name || "")} &lt;${escapeHtml(order.user.email)}&gt;</div>
        </div>
      `;

        // Tételek táblázat
        let itemsRows = "";
        order.items.forEach((item) => {
          const lineTotal = item.unit_price * item.quantity;
          itemsRows += `
          <tr>
            <td>
              <div>${escapeHtml(item.name)}</div>
              ${renderBurgerConfigTableHtml(item.config)}
            </td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">${formatFt(item.unit_price)} Ft</td>
            <td class="text-end">${formatFt(lineTotal)} Ft</td>
          </tr>
        `;
        });

        const itemsTable = `
        <div class="table-responsive mb-3">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Termék</th>
                <th class="text-center">Mennyiség</th>
                <th class="text-end">Egységár</th>
                <th class="text-end">Összesen</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>
      `;

        const footerHtml = `
        <div class="d-flex justify-content-end">
          <div class="fw-semibold">
            Végösszeg: ${formatFt(order.total_price)} Ft
          </div>
        </div>
      `;

        orderDetailsBody.innerHTML = headerHtml + itemsTable + footerHtml;
      } catch (err) {
        console.error("Hiba a rendelés részleteinek lekérdezésénél:", err);
        orderDetailsBody.innerHTML = `
        <div class="alert alert-danger small mb-0">
          Nem sikerült csatlakozni a szerverhez.
        </div>
      `;
      }
    });
  }

  async function uploadImageFile(file, statusEl) {
    if (!file) return null;

    const formData = new FormData();
    formData.append("image", file);

    if (statusEl) statusEl.textContent = "Kép feltöltése folyamatban...";

    try {
      const res = await apiFetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.imageUrl) {
        if (statusEl) statusEl.textContent = "Képfeltöltés sikertelen.";
        showToast(data.message || "Nem sikerült feltölteni a képet.", "danger");
        return null;
      }

      if (statusEl) statusEl.textContent = "Kép sikeresen feltöltve.";
      return data.imageUrl;
    } catch (err) {
      console.error("Képfeltöltési hiba:", err);
      if (statusEl) statusEl.textContent = "Képfeltöltés sikertelen.";
      showToast("Nem sikerült csatlakozni a szerverhez.", "danger");
      return null;
    }
  }

  // 🔹 Indításkor: ellenőrizzük, hogy admin-e a user
  checkAdmin();
});
