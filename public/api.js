const API_BASE = "";

async function apiFetch(path, options = {}) {
  const finalOptions = {
    credentials: "include",
    ...options,
  };

  return fetch(API_BASE + path, finalOptions);
}