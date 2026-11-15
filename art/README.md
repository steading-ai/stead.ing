# Art

The pictures Steading's pages show, and how each was made. A picture lives beside the page that shows it, under [`content/`](../content/); this folder keeps the record of how it was made.

## The history page

[`content/history.md`](../content/history.md) tells how Steading came about, and it's the one page drawn in pictures rather than shown in real output. Its scenes are pixel art in the manner of a cosy farming game: the desk of someone with more ideas than hours, the workshop where the plumbing took over, and the overgrown plot where a homestead of your own begins.

The chicken-and-egg loop is drawn in the same style but built in the page, not painted: each idea is a small object on a ring the page draws (an almanac for knowledge, a plan with seed packets for planning, a wheelbarrow for the work, a magnifying glass over a seedling for review, a padlocked gate for trust, a mailbox for reach), with a hen on her egg in the middle.

- **Day and night.** Every scene is drawn twice: by day for the light color scheme, by night for the dark. The night is drawn from the day, so nothing moves but the light.
- **True pixels.** Each scene is shown at its own size, 512 by 341 art pixels, or a whole multiple of it, with `image-rendering: pixelated`.
- **The site's colors.** Daylight and Loam, with ember as the one warm accent: the cursor by day, the lamp by night.
- **No people, no text in the picture, no stars.** The words belong to the page, so its Markdown twin says everything the pictures do.

## How a picture is made

1. **Generate it** with kotonoha's [`scripts/art/generate.py`](https://github.com/ivy/kotonoha/blob/main/scripts/art/generate.py), which calls OpenAI's Image API and writes a record of the call beside the picture: the prompt, the model, the reference images and their hashes. A night scene takes its day scene as its reference. The records are in [`history/`](history/), one per picture, and `style-reference.json` is the first desk, which the other scenes took their style from.
   The loop's six objects were generated together, as one sprite sheet of three by two (`loop-sheet-*.json`), so they share a style, and cut apart afterwards.
2. **Snap it to a grid** with [`scripts/art/snap.ts`](../scripts/art/snap.ts). Image models draw pixel art with soft edges and no real grid; the script shrinks the picture to its art-pixel canvas, holds every pixel fully opaque or fully clear, and reduces it to 48 colors. A night scene is cut out along its day scene's outline (`--mask`), since the model paints the dark around it in.

   ```bash
   node scripts/art/snap.ts desk/day.png content/history/desk-day.png
   node scripts/art/snap.ts desk/night.png content/history/desk-night.png --mask desk/day.png
   ```

   A sprite sheet is snapped at a coarser grid and cut into its cells, each 128 by 128 art pixels (`--grid` writes `OUT-1.png` to `OUT-6.png`, left to right, top to bottom), and the hen is cropped to what is drawn (`--trim`):

   ```bash
   node scripts/art/snap.ts loop/sheet-day.png loop-day.png --scale 4 --grid 3x2
   node scripts/art/snap.ts loop/center-day.png content/history/loop-hen-day.png --scale 4 --trim
   ```

The generated pictures are a few megabytes each and are not kept; the snapped ones that ship are.
