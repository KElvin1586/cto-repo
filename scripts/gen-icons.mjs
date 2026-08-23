// Generates QR Studio PWA icons programmatically (no image deps needed).
// Writes: public/icons/icon-192.png, icon-512.png, icon-512-maskable.png,
//         public/icons/apple-touch-icon.png
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public", "icons");

// ---------- Minimal PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw scanlines with filter byte 0
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Drawing ----------
function roundedRectMask(size, radius) {
  const mask = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inX = x, inY = y, inset = Math.max(0, radius);
      // corner circles
      const cc = [
        [inset, inset],
        [size - 1 - inset, inset],
        [inset, size - 1 - inset],
        [size - 1 - inset, size - 1 - inset],
      ];
      let inside = true;
      for (const [cx, cy] of cc) {
        const dx = x - cx, dy = y - cy;
        if (dx === 0 || dy === 0) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > inset && ((x < inset && y < inset) || (x > size - 1 - inset && y < inset) || (x < inset && y > size - 1 - inset) || (x > size - 1 - inset && y > size - 1 - inset))) {
          inside = false;
        }
      }
      if (inside) mask[y * size + x] = 1;
    }
  }
  return mask;
}

function drawIcon(size, { rounded = true, maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const bg = [79, 70, 229, 255]; // indigo-600
  const fg = [255, 255, 255, 255];
  const corner = Math.round(size * (rounded ? 0.18 : 0));
  const mask = rounded ? roundedRectMask(size, corner) : null;

  // background
  for (let i = 0; i < size * size; i++) {
    const m = mask ? mask[i] : 1;
    px[i * 4] = bg[0]; px[i * 4 + 1] = bg[1]; px[i * 4 + 2] = bg[2];
    px[i * 4 + 3] = m ? 255 : 0;
    void fg;
  }

  const u = size / 20; // unit module size
  const drawFinder = (ox, oy) => {
    const sq = (x, y, w) => {
      for (let yy = 0; yy < w; yy++)
        for (let xx = 0; xx < w; xx++) {
          const X = Math.round(ox + x + xx), Y = Math.round(oy + y + yy);
          if (X < 0 || Y < 0 || X >= size || Y >= size) continue;
          const m = mask ? mask[Y * size + X] : 1;
          if (!m) continue;
          const idx = (Y * size + X) * 4;
          px[idx] = fg[0]; px[idx + 1] = fg[1]; px[idx + 2] = fg[2]; px[idx + 3] = 255;
        }
    };
    sq(0, 0, Math.round(5 * u));
    sq(u, u, Math.round(3 * u));
    sq(2 * u, 2 * u, Math.round(1 * u));
  };

  drawFinder(2 * u, 2 * u);
  drawFinder(13 * u, 2 * u);
  drawFinder(2 * u, 13 * u);

  // scattered data dots (seeded pseudo-random)
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      // skip finder corners
      const X = r * u + 8 * u, Y = c * u + 8 * u;
      if ((r < 3 && c < 3) || (r < 3 && r > 4) ) continue;
      if (rand() > 0.6) continue;
      // small dot
      const d = Math.max(1, Math.round(u * 0.8));
      const x0 = Math.round(X), y0 = Math.round(Y);
      for (let yy = 0; yy < d; yy++)
        for (let xx = 0; xx < d; xx++) {
          const Xp = x0 + xx, Yp = y0 + yy;
          if (Xp < 0 || Yp < 0 || Xp >= size || Yp >= size) continue;
          const m = mask ? mask[Yp * size + Xp] : 1;
          if (m) { const idx = (Yp * size + Xp) * 4; px[idx] = fg[0]; px[idx+1] = fg[1]; px[idx+2] = fg[2]; px[idx+3] = 255; }
        }
    }
  }
  return encodePng(size, size, px);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "icon-192.png"), drawIcon(192, { rounded: true }));
writeFileSync(join(OUT, "icon-512.png"), drawIcon(512, { rounded: true }));
writeFileSync(join(OUT, "icon-512-maskable.png"), drawIcon(512, { rounded: false }));
writeFileSync(join(OUT, "apple-touch-icon.png"), drawIcon(180, { rounded: false }));
console.log("icons written to", OUT);
