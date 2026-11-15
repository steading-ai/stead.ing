/**
 * Turns a generated picture into true pixel art. Image models draw pixel art
 * with soft edges and no real grid; this shrinks the picture to its art-pixel
 * canvas, holds every pixel fully opaque or fully clear, and reduces it to a
 * fixed palette without dithering. The result is the small file a page shows,
 * scaled up with `image-rendering: pixelated`.
 *
 *   node scripts/art/snap.ts IN.png OUT.png [--scale 3] [--colors 48] [--mask DAY.png] [--grid 3x2] [--trim]
 *
 * `--mask` cuts the picture out along another picture's outline: a night scene
 * drawn from its day scene, whose model painted the dark around it in.
 * `--grid` cuts a sprite sheet into its cells, left to right and top to
 * bottom, as OUT-1.png, OUT-2.png and so on, each the same size.
 * `--trim` crops a single picture to what is drawn, with a little room around it.
 */
import { parseArgs } from "node:util";
import sharp, { type Sharp } from "sharp";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    scale: { type: "string", default: "3" },
    colors: { type: "string", default: "48" },
    mask: { type: "string" },
    grid: { type: "string" },
    trim: { type: "boolean", default: false },
  },
});
const [input, output] = positionals;
if (!input || !output) throw new Error("usage: node scripts/art/snap.ts IN.png OUT.png [--scale 3] [--colors 48] [--mask DAY.png]");

const meta = await sharp(input).metadata();
const width = Math.round((meta.width ?? 0) / Number(values.scale));
const height = Math.round((meta.height ?? 0) / Number(values.scale));
const shrink = (file: string) => sharp(file).resize(width, height, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const { data, info } = await shrink(input);
const outline = values.mask ? (await shrink(values.mask)).data : data;
for (let alpha = 3; alpha < data.length; alpha += 4) data[alpha] = (outline[alpha] ?? 0) >= 128 ? 255 : 0;

const snapped = await sharp(data, { raw: info }).png({ palette: true, colors: Number(values.colors), dither: 0 }).toBuffer();
const palette = (picture: Sharp) => picture.png({ palette: true, colors: Number(values.colors), dither: 0 });

if (values.grid) {
  const [columns = 1, rows = 1] = values.grid.split("x").map(Number);
  const cell = { width: Math.floor(width / columns), height: Math.floor(height / rows) };
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const file = output.replace(/\.png$/, `-${row * columns + column + 1}.png`);
      await palette(sharp(snapped).extract({ left: column * cell.width, top: row * cell.height, ...cell })).toFile(file);
      console.log(`${file}: ${cell.width}×${cell.height} art pixels`);
    }
  }
} else if (values.trim) {
  const trimmed = await sharp(snapped).trim().toBuffer({ resolveWithObject: true });
  const room = 4;
  await palette(sharp(trimmed.data).extend({ top: room, bottom: room, left: room, right: room, background: { r: 0, g: 0, b: 0, alpha: 0 } })).toFile(output);
  console.log(`${output}: ${trimmed.info.width + 2 * room}×${trimmed.info.height + 2 * room} art pixels`);
} else {
  await sharp(snapped).toFile(output);
  console.log(`${output}: ${width}×${height} art pixels, ${values.colors} colours`);
}
