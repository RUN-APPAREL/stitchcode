import { create as createQRCode } from "qrcode";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ECLevel = "L" | "M" | "Q" | "H";
export type DotStyle = "square" | "rounded" | "dots";
export type CornerStyle = "square" | "rounded";

export interface QRRenderOptions {
  ec: ECLevel;
  /** quiet zone, in modules — spec minimum is 4 */
  margin: number;
  fg: string;
  bg: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  /**
   * Merged logo: an N×N binary grid (1 = dark module) that replaces the
   * data modules in the centre of the code. Level H restores the data
   * underneath, so the mark literally becomes part of the matrix.
   */
  logoGrid: Uint8Array | null;
  /** grid resolution in modules (logoGrid is logoN × logoN) */
  logoN: number;
  /** logo region as fraction of the code width (0.1 – 0.3) */
  logoScale: number;
}

/** Odd module count for the merged-logo region, centred in the code. */
export function logoRegionModules(codeSize: number, scale: number): number {
  let n = Math.round(codeSize * scale);
  n = Math.max(5, Math.min(n, Math.floor(codeSize * 0.34)));
  return n % 2 === 0 ? n + 1 : n;
}

/**
 * Rasterise an image into an n×n module grid. Each cell is composited over
 * the code's background colour, then binarised against `threshold` — dark
 * pixels become dark modules, light pixels become light modules.
 */
export async function logoToGrid(
  src: string,
  n: number,
  threshold: number,
  bg: string,
): Promise<Uint8Array> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = bg === "transparent" ? "#ffffff" : bg;
  ctx.fillRect(0, 0, n, n);
  const s = Math.max(n / img.width, n / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, (n - dw) / 2, (n - dh) / 2, dw, dh);
  const { data } = ctx.getImageData(0, 0, n, n);
  const grid = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const lum =
      (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    grid[i] = lum < threshold ? 1 : 0;
  }
  return grid;
}

export interface QRMatrix {
  version: number;
  size: number;
  data: Uint8Array;
  get(x: number, y: number): boolean;
}

export const EC_INFO: Record<
  ECLevel,
  { label: string; recovery: string; capacity: string; pct: number }
> = {
  L: { label: "Low", recovery: "≈ 7% damage", capacity: "100% capacity", pct: 100 },
  M: { label: "Medium", recovery: "≈ 15% damage", capacity: "≈ 86% capacity", pct: 86 },
  Q: { label: "Quartile", recovery: "≈ 25% damage", capacity: "≈ 66% capacity", pct: 66 },
  H: { label: "High", recovery: "≈ 30% damage", capacity: "≈ 56% capacity", pct: 56 },
};

/* ------------------------------------------------------------------ */
/* Matrix creation                                                     */
/* ------------------------------------------------------------------ */

export function createMatrix(text: string, ec: ECLevel): QRMatrix {
  const qr = createQRCode(text, { errorCorrectionLevel: ec });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return {
    version: qr.version,
    size,
    data,
    get: (x, y) => data[y * size + x] === 1,
  };
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/* ------------------------------------------------------------------ */
/* Structure maps (finder / alignment / timing)                        */
/* ------------------------------------------------------------------ */

/** ISO/IEC 18004 alignment-pattern center coordinates, versions 1–40. */
const ALIGNMENT: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

export function alignmentCenters(version: number): Array<[number, number]> {
  const pos = ALIGNMENT[Math.min(version, 40)] ?? [];
  const centers: Array<[number, number]> = [];
  for (const r of pos) {
    for (const c of pos) {
      const overFinder =
        (r === 6 && c === 6) ||
        (r === 6 && c === pos[pos.length - 1]) ||
        (r === pos[pos.length - 1] && c === 6);
      if (!overFinder) centers.push([c, r]);
    }
  }
  return centers;
}

export function inFinderRegion(x: number, y: number, size: number): boolean {
  return (
    (x < 7 && y < 7) ||
    (x >= size - 7 && y < 7) ||
    (x < 7 && y >= size - 7)
  );
}

function inAlignmentRegion(
  x: number,
  y: number,
  centers: Array<[number, number]>,
): boolean {
  return centers.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2);
}

/** Functional patterns always render as solid squares for scan safety. */
function isFunctional(x: number, y: number, size: number, centers: Array<[number, number]>): boolean {
  return inFinderRegion(x, y, size) || inAlignmentRegion(x, y, centers) || x === 6 || y === 6;
}

/* ------------------------------------------------------------------ */
/* SVG renderer                                                        */
/* ------------------------------------------------------------------ */

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

function finderSVG(ox: number, oy: number, o: QRRenderOptions): string {
  const r = o.cornerStyle === "rounded";
  const ro = r ? 2.3 : 0;
  const ri = r ? 1.5 : 0;
  const rc = r ? 1.05 : 0;
  return (
    `<rect x="${f(ox)}" y="${f(oy)}" width="7" height="7" rx="${ro}" fill="${o.fg}"/>` +
    `<rect x="${f(ox + 1)}" y="${f(oy + 1)}" width="5" height="5" rx="${ri}" fill="${o.bg}"/>` +
    `<rect x="${f(ox + 2)}" y="${f(oy + 2)}" width="3" height="3" rx="${rc}" fill="${o.fg}"/>`
  );
}

/**
 * Merged-logo pass: paints the logo's module grid into the centre of the
 * matrix. Dark cells become foreground modules, light cells background —
 * the mark IS the code. Functional patterns are never overwritten.
 */
function mergedLogoSVG(
  m: QRMatrix,
  o: QRRenderOptions,
  centers: Array<[number, number]>,
  mg: number,
): string {
  if (!o.logoGrid || o.logoN < 3 || o.logoN > m.size) return "";
  const region = o.logoN;
  const ox = Math.floor((m.size - region) / 2);
  let out = "";
  for (let j = 0; j < region; j++) {
    for (let i = 0; i < region; i++) {
      const x = ox + i;
      const y = ox + j;
      if (inFinderRegion(x, y, m.size) || isFunctional(x, y, m.size, centers)) continue;
      const dark = o.logoGrid[j * region + i] === 1;
      out += `<rect x="${mg + x}" y="${mg + y}" width="1" height="1" fill="${
        dark ? o.fg : o.bg
      }"/>`;
    }
  }
  return out;
}

export function renderSVG(m: QRMatrix, o: QRRenderOptions, px = 560): string {
  const centers = alignmentCenters(m.version);
  const total = m.size + o.margin * 2;
  const crisp = o.dotStyle === "square" ? ` shape-rendering="crispEdges"` : "";
  let body = `<rect width="${total}" height="${total}" fill="${o.bg}"/>`;

  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.get(x, y)) continue;
      if (inFinderRegion(x, y, m.size)) continue;
      const px_ = x + o.margin;
      const py_ = y + o.margin;
      const styled = !isFunctional(x, y, m.size, centers);
      if (o.dotStyle === "dots" && styled) {
        body += `<circle cx="${f(px_ + 0.5)}" cy="${f(py_ + 0.5)}" r="0.44" fill="${o.fg}"/>`;
      } else if (o.dotStyle === "rounded" && styled) {
        body += `<rect x="${f(px_ + 0.06)}" y="${f(py_ + 0.06)}" width="0.88" height="0.88" rx="0.3" fill="${o.fg}"/>`;
      } else {
        body += `<rect x="${px_}" y="${py_}" width="1" height="1" fill="${o.fg}"/>`;
      }
    }
  }

  const mg = o.margin;
  body += finderSVG(mg, mg, o);
  body += finderSVG(mg + m.size - 7, mg, o);
  body += finderSVG(mg, mg + m.size - 7, o);

  body += mergedLogoSVG(m, o, centers, mg);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${total} ${total}" width="${px}" height="${px}"${crisp} role="img" aria-label="QR code">` +
    body +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ */
/* Canvas renderer (high-res PNG export)                               */
/* ------------------------------------------------------------------ */

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderCanvas(
  m: QRMatrix,
  o: QRRenderOptions,
  px: number,
): Promise<HTMLCanvasElement> {
  const total = m.size + o.margin * 2;
  const s = px / total;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  const centers = alignmentCenters(m.version);

  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, px, px);

  const module = (x: number, y: number, styled: boolean) => {
    const X = (x + o.margin) * s;
    const Y = (y + o.margin) * s;
    ctx.fillStyle = o.fg;
    if (o.dotStyle === "dots" && styled) {
      ctx.beginPath();
      ctx.arc(X + s / 2, Y + s / 2, s * 0.44, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.dotStyle === "rounded" && styled) {
      rr(ctx, X + s * 0.06, Y + s * 0.06, s * 0.88, s * 0.88, s * 0.3);
      ctx.fill();
    } else {
      ctx.fillRect(X, Y, s + 0.5, s + 0.5);
    }
  };

  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.get(x, y) || inFinderRegion(x, y, m.size)) continue;
      module(x, y, !isFunctional(x, y, m.size, centers));
    }
  }

  const finder = (ox: number, oy: number) => {
    const X = (ox + o.margin) * s;
    const Y = (oy + o.margin) * s;
    const rounded = o.cornerStyle === "rounded";
    ctx.fillStyle = o.fg;
    rr(ctx, X, Y, 7 * s, 7 * s, rounded ? 2.3 * s : 0);
    ctx.fill();
    ctx.fillStyle = o.bg;
    rr(ctx, X + s, Y + s, 5 * s, 5 * s, rounded ? 1.5 * s : 0);
    ctx.fill();
    ctx.fillStyle = o.fg;
    rr(ctx, X + 2 * s, Y + 2 * s, 3 * s, 3 * s, rounded ? 1.05 * s : 0);
    ctx.fill();
  };

  finder(0, 0);
  finder(m.size - 7, 0);
  finder(0, m.size - 7);

  /* merged logo — the mark's cells become real modules */
  if (o.logoGrid && o.logoN >= 3 && o.logoN <= m.size) {
    const region = o.logoN;
    const ox = Math.floor((m.size - region) / 2);
    for (let j = 0; j < region; j++) {
      for (let i = 0; i < region; i++) {
        const x = ox + i;
        const y = ox + j;
        if (inFinderRegion(x, y, m.size) || isFunctional(x, y, m.size, centers)) continue;
        const dark = o.logoGrid[j * region + i] === 1;
        ctx.fillStyle = dark ? o.fg : o.bg;
        ctx.fillRect((x + o.margin) * s, (y + o.margin) * s, s + 0.5, s + 0.5);
      }
    }
  }

  return canvas;
}

/* ------------------------------------------------------------------ */
/* Colour science (WCAG 2.2 contrast)                                  */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function isValidHex(v: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}

function channelLum(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                      */
/* ------------------------------------------------------------------ */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png");
  });
}
