import type { APIRoute } from "astro";
import { getDocs, getSiteInfo } from "../lib/content.ts";
import { llmsFullTxt } from "../lib/discovery.ts";
import { MEDIA_TYPES } from "../site.ts";

export const GET: APIRoute = async () =>
  new Response(llmsFullTxt(await getSiteInfo(), await getDocs()), { headers: { "Content-Type": MEDIA_TYPES.text } });
