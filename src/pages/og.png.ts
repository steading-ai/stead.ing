import type { APIRoute } from "astro";
import { renderCard } from "../lib/card.ts";
import { getLanding } from "../lib/content.ts";
import { SITE } from "../site.ts";

/** The picture a shared link to this site shows. */
export const GET: APIRoute = async () => {
  const { headline } = await getLanding();
  const png = await renderCard({ project: SITE.project, headline, host: new URL(SITE.origin).host });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
