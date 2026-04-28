export function parseIngredients(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function toIngredientsJson(raw) {
  if (!raw) return null; // null/undefined/"" esetén

  if (!Array.isArray(raw)) {
    // ha mégis rossz típus jön, ne omoljon össze
    return null;
  }

  const arr = raw
    .map((x) => String(x).trim())
    .filter(Boolean);

  return arr.length ? JSON.stringify(arr) : null;
}

