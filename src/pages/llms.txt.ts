import type { APIRoute } from "astro";
import { getDocs, getSiteInfo, PROJECTS } from "../lib/content.ts";
import { llmsTxt } from "../lib/discovery.ts";
import { MEDIA_TYPES } from "../site.ts";

export const GET: APIRoute = async () =>
  new Response(llmsTxt(await getSiteInfo(), await getDocs(), PROJECTS), { headers: { "Content-Type": MEDIA_TYPES.text } });
