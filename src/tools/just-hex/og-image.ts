// The OGP image of a Just HEX color: a 1200×630 PNG of the color alone.
// It is a palette PNG of one bit per pixel, every pixel the palette's first
// color, so the compressed pixels are the same for every color and are made
// once; only the palette (3 bytes and its checksum) differs. A request takes
// far less than the Free plan's 10 ms of CPU time.

export const WIDTH = 1200;
export const HEIGHT = 630;

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** A PNG chunk: length, type, data and the CRC of the type and the data. */
const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
};

const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

const header = (() => {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, WIDTH);
  view.setUint32(4, HEIGHT);
  // Bit depth 1, color type 3 (palette); compression, filter and interlace 0.
  data.set([1, 3, 0, 0, 0], 8);
  return chunk("IHDR", data);
})();

const end = chunk("IEND", new Uint8Array(0));

/** The zlib stream of the pixels: each row, filter 0 then zero bits. */
const compress = async (): Promise<Uint8Array> => {
  const rows = new Uint8Array(HEIGHT * (1 + WIDTH / 8));
  const stream = new Blob([rows])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

let pixels: Promise<Uint8Array> | undefined;

/** The PNG of a color given as 6 uppercase hex digits. */
export const colorPng = async (hex: string): Promise<Uint8Array> => {
  if (!/^[0-9A-F]{6}$/.test(hex)) throw new Error(`not a color: ${hex}`);
  // Made once per isolate; a failure is not kept, so the next request
  // tries again.
  pixels ??= compress()
    .then((zlib) => chunk("IDAT", zlib))
    .catch((error: unknown) => {
      pixels = undefined;
      throw error;
    });
  const palette = chunk(
    "PLTE",
    Uint8Array.from(hex.match(/../g)!, (pair) => parseInt(pair, 16)),
  );
  const parts = [signature, header, palette, await pixels, end];
  const png = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
};
