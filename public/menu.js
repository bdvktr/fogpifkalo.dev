document.addEventListener("DOMContentLoaded", () => {
    const burgerList = document.getElementById("burgerList");
    const sideList = document.getElementById("sideList");
    const drinkList = document.getElementById("drinkList");
    const sauceList = document.getElementById("sauceList");

    function formatFt(value) {
        return Math.round(Number(value)).toLocaleString("hu-HU");
    }

    function createProductCard(product) {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";

        col.innerHTML = `
            <div class="card menu-card h-100 shadow-sm">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title mb-1">${product.name}</h5>
                ${product.description
                ? `<p class="card-text small text-muted mb-2">${product.description}</p>`
                : ""
            }
                <div class="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                  <strong>${formatFt(product.price)} Ft</strong>
                  <button 
                    class="btn btn-sm btn-primary order-btn"
                    data-product-id="${product.id}">
                    Rendelés
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
                const msg =
                    data.message || "Nem sikerült betölteni a menüt.";
                burgerList.textContent = msg;
                sideList.textContent = msg;
                drinkList.textContent = msg;
                sauceList.textContent = msg;
                return;
            }

            const products = data.products || [];

            // töröljük a "Betöltés..." szöveget
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
                if (grouped[cat]) {
                    grouped[cat].push(p);
                } else {
                    grouped.burger.push(p);
                }
            });

            function renderCategory(listEl, items, emptyText) {
                if (!listEl) return;
                if (!items || items.length === 0) {
                    listEl.textContent = emptyText;
                    return;
                }
                items.forEach((p) => {
                    listEl.appendChild(createProductCard(p));
                });
            }

            renderCategory(
                burgerList,
                grouped.burger,
                "Jelenleg nincsenek burgerek a menüben."
            );
            renderCategory(
                sideList,
                grouped.side,
                "Jelenleg nincsenek köretek a menüben."
            );
            renderCategory(
                drinkList,
                grouped.drink,
                "Jelenleg nincsenek innivalók a menüben."
            );
            renderCategory(
                sauceList,
                grouped.sauce,
                "Jelenleg nincsenek szószok a menüben."
            );
        } catch (err) {
            console.error("Hiba a /api/menu hívásnál:", err);
            burgerList.textContent = "Nem sikerült csatlakozni a szerverhez.";
            sideList.textContent = "Nem sikerült csatlakozni a szerverhez.";
            drinkList.textContent = "Nem sikerült csatlakozni a szerverhez.";
            sauceList.textContent = "Nem sikerült csatlakozni a szerverhez.";
        }
    }

    loadMenu();
});
