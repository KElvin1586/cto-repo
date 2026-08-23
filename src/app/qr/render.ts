// QR module matrix extraction and rendering (canvas + SVG). Everything here is
// pure computation on the module grid produced by the `qrcode` library — no data
// ever leaves the browser.

import QRCode from "qrcode";
import type { EccLevel, QrOptions, QrStyle } from "~/app/types";

export interface Matrix {
  /** Number of modules including the quiet-zone margin. */
  n: number;
  /** Inner modules (excluding margin), n0 x n0 grid, row-major. */
  inner: Uint8Array;
  n0: number;
  margin: number;
}

const ECC_MAP: Record<EccLevel, "L" | "M" | "Q" | "H"> = {
  L: "L",
  M: "M",
  Q: "Q",
  H: "H",
};

export function buildMatrix(content: string, ecc: EccLevel, margin: number): Matrix {
  const q = QRCode.create(content, { errorCorrectionLevel: ECC_MAP[ecc] });
  const n0 = q.modules.size;
  const inner = new Uint8Array(n0 * n0);
  for (let r = 0; r < n0; r++) {
    for (let c = 0; c < n0; c++) {
      inner[r * n0 + c] = q.modules.get(r, c) ? 1 : 0;
    }
  }
  return { n: n0 + margin * 2, inner, n0, margin };
}

export function isDark(m: Matrix, r: number, c: number): boolean {
  if (r < 0 || c < 0 || r >= m.n0 || c >= m.n0) return false;
  return m.inner[r * m.n0 + c] === 1;
}

/** True if module (r,c) is inside one of the three finder zones. */
function inFinderZone(m: Matrix, r: number, c: number): boolean {
  const top = r < 8;
  const bottom = r >= m.n0 - 8;
  const left = c < 8;
  const right = c >= m.n0 - 8;
  return (top && left) || (top && right) || (bottom && left);
}

export interface RenderGeom {
  cell: number;
  margin: number; // margin in px
}

/** The number of raw modules for a given output pixel size and margin. */
function geomFor(m: Matrix, px: number): RenderGeom {
  const cell = px / m.n;
  return { cell, margin: m.margin * cell };
}

// ---------- Canvas rendering ----------

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  m: Matrix,
  r: number,
  c: number,
  x: number,
  y: number,
  cell: number,
  style: QrStyle,
) {
  const finder = inFinderZone(m, r, c);
  if (style === "dots" || (style === "classy" && !finder)) {
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, cell * 0.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (style === "rounded" || (style === "classy" && finder)) {
    roundedRect(ctx, x, y, cell, cell, cell * 0.35);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, cell, cell);
}

function loadLogo(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo could not be loaded"));
    img.src = src;
  });
}

/** Render the QR to a canvas at opts.size pixels, optionally embedding a logo. */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  m: Matrix,
  opts: QrOptions,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  const px = opts.size;
  canvas.width = px;
  canvas.height = px;

  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, px, px);

  const { cell, margin } = geomFor(m, px);
  const offset = margin;

  ctx.fillStyle = opts.fg;
  for (let r = 0; r < m.n0; r++) {
    for (let c = 0; c < m.n0; c++) {
      if (!isDark(m, r, c)) continue;
      drawModule(ctx, m, r, c, offset + c * cell, offset + r * cell, cell, opts.style);
    }
  }

  if (opts.logo) {
    let img: HTMLImageElement;
    try {
      img = await loadLogo(opts.logo);
    } catch {
      return; // logo failed to load — render QR without it, don't throw
    }
    const logoSize = px * opts.logoScale;
    const pad = px * opts.logoPadding;
    const cx = px / 2;
    const cy = px / 2;
    const total = logoSize + pad * 2;
    const lx = cx - total / 2;
    const ly = cy - total / 2;

    ctx.save();
    // White backing plate for scannability
    ctx.fillStyle = opts.bg;
    roundedRect(ctx, lx, ly, total, total, total * 0.18);
    ctx.fill();
    ctx.beginPath();
    roundedRect(ctx, lx, ly, total, total, total * 0.18);
    ctx.clip();
    const iw = img.naturalWidth || logoSize;
    const ih = img.naturalHeight || logoSize;
    const scale = Math.min(logoSize / iw, logoSize / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }
}

// ---------- SVG rendering ----------

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svgShape(cell: number, style: QrStyle, finder: boolean): (x: number, y: number) => string {
  if (style === "dots" || (style === "classy" && !finder)) {
    const r = cell * 0.5;
    return (x, y) =>
      `<circle cx="${(x + cell / 2).toFixed(3)}" cy="${(y + cell / 2).toFixed(3)}" r="${r.toFixed(
        3,
      )}"/>`;
  }
  if (style === "rounded" || (style === "classy" && finder)) {
    return (x, y) =>
      `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cell.toFixed(3)}" height="${cell.toFixed(
        3,
      )}" rx="${(cell * 0.35).toFixed(3)}"/>`;
  }
  return (x, y) => `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cell.toFixed(3)}" height="${cell.toFixed(3)}"/>`;
}

/** Build a complete standalone SVG string (no logo image embedding). */
export function renderToSvg(m: Matrix, opts: QrOptions): string {
  const w = opts.size;
  const { cell, margin } = geomFor(m, w);
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" role="img" aria-label="QR code">`,
  );
  parts.push(`<rect width="${w}" height="${w}" fill="${esc(opts.bg)}"/>`);
  parts.push(`<g fill="${esc(opts.fg)}">`);
  for (let r = 0; r < m.n0; r++) {
    for (let c = 0; c < m.n0; c++) {
      if (!isDark(m, r, c)) continue;
      const finder = inFinderZone(m, r, c);
      const x = margin + c * cell;
      const y = margin + r * cell;
      parts.push(svgShape(cell, opts.style, finder)(x, y));
    }
  }
  parts.push(`</g></svg>`);
  return parts.join("");
}

/** A data-URL PNG from a rendered canvas. */
export function canvasToDataUrl(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality = 0.92): string {
  return canvas.toDataURL(type, quality);
}
