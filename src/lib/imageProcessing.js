const HEIC_TYPES = ["image/heic", "image/heif"];
const MAX_DIMENSION = 2560;
const THUMB_DIMENSION = 480;
const JPEG_QUALITY = 0.9;
const THUMB_QUALITY = 0.8;

function isHeic(file) {
  const name = file.name.toLowerCase();
  return HEIC_TYPES.includes(file.type) || name.endsWith(".heic") || name.endsWith(".heif");
}

async function toDecodableBlob(file) {
  if (!isHeic(file)) return file;
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(converted) ? converted[0] : converted;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      quality
    )
  );
}

function drawScaled(bitmap, maxDimension) {
  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

// Decodes (converting HEIC if needed) and produces two re-encoded JPEGs: a
// full-size version capped at MAX_DIMENSION and a small thumbnail. Re-encoding
// through canvas strips all EXIF/GPS metadata as a side effect, so orientation
// must be baked into the pixels first via imageOrientation: "from-image" or
// portrait photos would come out sideways. Supabase's on-the-fly image
// transform requires a paid plan, so thumbnails are generated here instead.
export async function processImage(file) {
  const decodableBlob = await toDecodableBlob(file);
  const bitmap = await createImageBitmap(decodableBlob, { imageOrientation: "from-image" });

  const full = drawScaled(bitmap, MAX_DIMENSION);
  const thumb = drawScaled(bitmap, THUMB_DIMENSION);
  bitmap.close?.();

  const [blob, thumbBlob] = await Promise.all([
    canvasToBlob(full.canvas, JPEG_QUALITY),
    canvasToBlob(thumb.canvas, THUMB_QUALITY),
  ]);

  return { blob, width: full.width, height: full.height, thumbBlob };
}

export { isHeic };
