/**
 * Turns a generated picture into true pixel art. Image models draw pixel art
 * with soft edges and no real grid; this shrinks the picture to its art-pixel
 * canvas, holds every pixel fully opaque or fully clear, and reduces it to a
 * fixed palette without dithering. The result is the small file a page shows,
 * scaled up with `image-rendering: pixelated`.
 *
 *   node scripts/art/snap.ts IN.png OUT.png [--scale 3] [--colors 48] [--mask DAY.png]
 *
 * `--mask` cuts the picture out along another picture's outline: a night scene
 * drawn from its day scene, whose model painted the dark around it in.
 */
import { parseArgs } from "node:util";
import sharp from "sharp";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { scale: { type: "string", default: "3" }, colors: { type: "string", default: "48" }, mask: { type: "string" } },
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

await sharp(data, { raw: info })
  .png({ palette: true, colors: Number(values.colors), dither: 0 })
  .toFile(output);
console.log(`${output}: ${width}×${height} art pixels, ${values.colors} colours`);
