import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal PNG encoder used only by the demo seed.
 *
 * The seeded photo references need real image files on disk, otherwise the
 * AI Photo Search review UI renders broken <Image> tags. Rather than commit
 * binary fixtures (or pull `sharp` into @kostas/database just for this), we
 * generate flat two-tone swatches here with `node:zlib` — no dependency, and
 * the output is a real PNG so the storage route's existing `.png` content
 * type applies unchanged.
 *
 * SVG would be simpler to emit but the storage route deliberately does not
 * serve `image/svg+xml`; inline script in an SVG served from our own origin
 * is an XSS vector, so PNG is the correct format to add here.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/** Shifts a channel toward black/white so the swatch reads as textured, not flat. */
function shade(channel: number, amount: number): number {
  return Math.max(0, Math.min(255, Math.round(channel + amount)));
}

/**
 * Renders a square swatch of `hex` with a subtle diagonal weave, so seeded
 * fabric/item photos look like material samples rather than solid blocks.
 */
export function swatchPng(hex: string, size = 320): Buffer {
  const [r, g, b] = hexToRgb(hex);
  const raw = Buffer.alloc((size * 3 + 1) * size);

  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0; // PNG filter type 0 (None) for this scanline
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      // Two overlapping diagonals at different periods read as a weave.
      const weave = ((x + y) % 8 < 4 ? 10 : -10) + ((x - y) % 16 < 8 ? 5 : -5);
      raw[offset] = shade(r, weave);
      raw[offset + 1] = shade(g, weave);
      raw[offset + 2] = shade(b, weave);
      offset += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = truecolour RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Writes a swatch to `<rootDir>/<key>`, creating parent directories. */
export async function writeDemoImage(
  rootDir: string,
  key: string,
  hex: string,
): Promise<void> {
  const absolutePath = path.join(rootDir, key);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, swatchPng(hex));
}
