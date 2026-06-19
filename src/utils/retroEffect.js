function fadeAndCrush(d) {
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i]     = d[i]     * 0.3 + gray * 0.7;
    d[i + 1] = d[i + 1] * 0.3 + gray * 0.7;
    d[i + 2] = d[i + 2] * 0.3 + gray * 0.7;
    d[i]     = d[i]     * 0.75 + 28;
    d[i + 1] = d[i + 1] * 0.75 + 20;
    d[i + 2] = d[i + 2] * 0.75 + 10;
  }
}

function applySepia(d) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
}

function applyPosterize(d, levels) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = Math.round(Math.round(d[i]     / step) * step);
    d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
    d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
  }
}

function applyGrain(d, intensity) {
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * intensity;
    d[i]     = Math.max(0, Math.min(255, d[i]     + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
}

function drawScanlines(ctx, w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
}

function drawScratches(ctx, w, h) {
  for (let i = 0; i < 20; i++) {
    const x  = Math.random() * w;
    const y0 = Math.random() * h * 0.5;
    const len = h * (0.15 + Math.random() * 0.35);
    const b  = 160 + Math.random() * 70;
    ctx.strokeStyle = `rgba(${b},${b * 0.85},${b * 0.65},0.55)`;
    ctx.lineWidth = Math.random() < 0.8 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, y0 + len);
    ctx.stroke();
  }
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function pixelateCtx(canvas, ctx, pixelSize) {
  const w = canvas.width, h = canvas.height;
  const sw = Math.max(1, Math.floor(w / pixelSize));
  const sh = Math.max(1, Math.floor(h / pixelSize));
  const tmp = document.createElement("canvas");
  tmp.width = sw; tmp.height = sh;
  const tc = tmp.getContext("2d");
  tc.imageSmoothingEnabled = false;
  tc.drawImage(canvas, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tmp, 0, 0, w, h);
}

export async function applyRetroEffect(dataURL, pixelSize = 3) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataURL;
  });

  const MAX_W = 1920;
  const scale = img.width > MAX_W ? MAX_W / img.width : 1;
  const w = Math.floor(img.width * scale);
  const h = Math.floor(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // Grayscale
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);

  // Light pixelation
  pixelateCtx(canvas, ctx, pixelSize);

  return canvas.toDataURL("image/jpeg", 0.85);
}
