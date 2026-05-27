// generate-icons.js - generate icon-192.png and icon-512.png from scratch (pure Node, no deps)
// Same pattern as madrasah-hadir-digital.
// Run once: node generate-icons.js

const fs = require('fs');
const zlib = require('zlib');

function makePNG(size, draw) {
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const i = (y * size + x) * 4;
      buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
    }
  }
  return encodePNG(buf, size);
}

function encodePNG(rgba, size) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // IDAT: filter byte 0 per row
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const crcTable = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = (crcTable[(c ^ b) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Draw the icon: green circle background + white "PKG" letters in chunky pixel font
const PRIMARY = [4, 122, 58, 255]; // #047a3a Kemenag green
const PRIMARY_DARK = [3, 90, 42, 255];
const WHITE = [255, 255, 255, 255];
const TRANSPARENT = [0, 0, 0, 0];

// 5x7 pixel font for letters P, K, G
const FONT = {
  P: [
    "1110",
    "1001",
    "1001",
    "1110",
    "1000",
    "1000",
    "1000",
  ],
  K: [
    "1001",
    "1010",
    "1100",
    "1100",
    "1010",
    "1001",
    "1001",
  ],
  G: [
    "0111",
    "1000",
    "1000",
    "1011",
    "1001",
    "1001",
    "0111",
  ],
};

function drawIcon(x, y, size) {
  // Background: gradient circle
  const cx = size / 2, cy = size / 2;
  const dx = x - cx, dy = y - cy;
  const r = Math.sqrt(dx*dx + dy*dy);
  const radius = size / 2 - 1;

  if (r > radius) return TRANSPARENT;

  // gradient
  const t = r / radius;
  const c = [
    Math.round(PRIMARY[0] * (1-t*0.3) + PRIMARY_DARK[0] * t * 0.3),
    Math.round(PRIMARY[1] * (1-t*0.3) + PRIMARY_DARK[1] * t * 0.3),
    Math.round(PRIMARY[2] * (1-t*0.3) + PRIMARY_DARK[2] * t * 0.3),
    255,
  ];

  // Draw "PKG" in middle
  // Each letter cell: 4 wide, 7 tall. Letters: P K G with 1px gaps.
  // Total width: 4+1+4+1+4 = 14 cells. Height: 7 cells.
  // Scale to fit ~60% of icon.
  const cellW = Math.floor(size * 0.55 / 14);
  const cellH = Math.floor(size * 0.5 / 7);
  const cell = Math.min(cellW, cellH);
  const totalW = cell * 14;
  const totalH = cell * 7;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - totalH) / 2);

  if (x < startX || x >= startX + totalW || y < startY || y >= startY + totalH) {
    return c;
  }
  const lx = x - startX;
  const ly = y - startY;
  const col = Math.floor(lx / cell);
  const row = Math.floor(ly / cell);
  let letter, lcol;
  if (col < 4) { letter = 'P'; lcol = col; }
  else if (col === 4) { return c; }
  else if (col < 9) { letter = 'K'; lcol = col - 5; }
  else if (col === 9) { return c; }
  else if (col < 14) { letter = 'G'; lcol = col - 10; }
  else return c;

  const pat = FONT[letter];
  if (row < 0 || row >= pat.length) return c;
  const ch = pat[row][lcol];
  if (ch === '1') return WHITE;
  return c;
}

const sizes = [192, 512];
for (const s of sizes) {
  const png = makePNG(s, drawIcon);
  const out = `icon-${s}.png`;
  fs.writeFileSync(out, png);
  console.log(`Generated ${out} (${png.length} bytes, ${s}x${s})`);
}
