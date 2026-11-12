import type { APIRoute } from "astro";
import { THEMES } from "../lib/color.ts";
import { markSvg } from "../lib/mark.ts";
import { SITE } from "../site.ts";

export const GET: APIRoute = () =>
  new Response(markSvg(SITE.project, { light: THEMES.light.ink, dark: THEMES.dark.ink }), {
    headers: { "Content-Type": "image/svg+xml" },
  });
