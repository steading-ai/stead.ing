import type { APIRoute } from "astro";
import { getSiteInfo } from "../lib/content.ts";
import { robotsTxt } from "../lib/discovery.ts";
import { MEDIA_TYPES } from "../site.ts";

export const GET: APIRoute = async () => new Response(robotsTxt(await getSiteInfo()), { headers: { "Content-Type": MEDIA_TYPES.text } });
