import type { APIRoute } from "astro";
import { getDocs, getSiteInfo, PROJECTS } from "../lib/content.ts";
import { indexMarkdown } from "../lib/discovery.ts";
import { MEDIA_TYPES } from "../site.ts";

export const GET: APIRoute = async () =>
  new Response(indexMarkdown(await getSiteInfo(), await getDocs(), PROJECTS), {
    headers: { "Content-Type": MEDIA_TYPES.markdown },
  });
