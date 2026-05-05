import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // IDE fognak menni a képek (a public már statikusan ki van szolgálva)
    cb(null, path.resolve(__dirname, "../../public/uploads/products"));
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  },
});

// Csak konkrétan engedélyezett képtípusokat engedünk.
// A mimetype és a kiterjesztés együtt számít, hogy ne menjen át pl. SVG vagy átnevezett fájl.
function fileFilter(req, file, cb) {
  const mimeType = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ALLOWED_IMAGE_TYPES.get(mimeType);

  if (!allowedExtensions || !allowedExtensions.includes(ext)) {
    const err = new Error("Csak JPG, PNG vagy WEBP képfájl tölthető fel.");
    err.statusCode = 400;
    return cb(err, false);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

const uploadSingleProductImage = upload.single("image");

function getMulterErrorMessage(err) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return "A kép maximum 5 MB lehet.";
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return "Egyszerre csak egy kép tölthető fel.";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return "Csak az image mezőben küldött egyetlen képfájl tölthető fel.";
  }

  return "Nem sikerült feltölteni a képet.";
}

export function handleProductImageUpload(req, res, next) {
  uploadSingleProductImage(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: getMulterErrorMessage(err),
      });
    }

    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Nem sikerült feltölteni a képet.",
    });
  });
}
