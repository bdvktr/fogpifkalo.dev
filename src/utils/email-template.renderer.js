import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "../templates/emails");
const templateCache = new Map();

const DEFAULT_EMAIL_DATA = {
  brandName: "FogPifkáló",
  brandSubtitle: "Prémium burgerek",
  restaurantAddress: "7700 Mohács, Szabadság utca 18.",
  restaurantPhone: "+36 30 872 0010",
  restaurantWebsite: "fogpifkalo.hu",
  preheader: "",
  ctaUrl: "#",
};

export function escapeEmailHtml(value) {
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

function readTemplate(fileName) {
  const safeFileName = path.basename(fileName);
  const templatePath = path.join(templatesDir, safeFileName);

  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath);
  }

  const content = fs.readFileSync(templatePath, "utf8");
  templateCache.set(templatePath, content);
  return content;
}

function renderString(template, data) {
  return template
    .replace(/{{{\s*([\w.]+)\s*}}}/g, (_, key) => {
      const value = getValue(data, key);
      return value == null ? "" : String(value);
    })
    .replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
      const value = getValue(data, key);
      return escapeEmailHtml(value == null ? "" : value);
    });
}

function getValue(data, key) {
  return key.split(".").reduce((current, part) => {
    if (current == null) {
      return undefined;
    }

    return current[part];
  }, data);
}

export function renderEmailTemplate(templateName, data = {}) {
  const layout = readTemplate("layout.html");
  const template = readTemplate(templateName);
  const mergedData = {
    ...DEFAULT_EMAIL_DATA,
    ...data,
  };

  const body = renderString(template, mergedData);
  return renderString(layout, {
    ...mergedData,
    body,
  });
}
