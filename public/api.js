const API_BASE = "";

// egyszerre csak 1 refresh fusson
let refreshPromise = null;

async function doRefresh() {
  // már fut refresh? várjuk meg
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(API_BASE + "/api/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      // ha nem ok, akkor bukta
      if (!res.ok) return false;

      // a backend nálad json-t ad vissza: { success: true/false, ... }
      // de ha valamiért nem json, akkor is kezeljük
      try {
        const data = await res.json();
        return !!data?.success;
      } catch (_) {
        return true;
      }
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function apiFetch(path, options = {}) {
  const finalOptions = {
    credentials: "include",
    ...options,
  };

  // 1) első próbálkozás
  let res = await fetch(API_BASE + path, finalOptions);

  // 2) ha 401, megpróbálunk refresh-elni és 1x retry
  if (res.status === 401) {
    const refreshed = await doRefresh();

    if (refreshed) {
      res = await fetch(API_BASE + path, finalOptions);
    }
  }

  return res;
}