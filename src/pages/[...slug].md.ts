import type { APIRoute, GetStaticPaths } from "astro";
import { getPages, type LoadedDoc } from "../lib/content.ts";
import { docMarkdown } from "../lib/docs.ts";
import { MEDIA_TYPES, SITE } from "../site.ts";

export const getStaticPaths = (async () =>
  (await getPages()).docs.map((doc) => ({ params: { slug: doc.path.slice(1, -1) }, props: { doc } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(docMarkdown(props.doc as LoadedDoc, SITE), { headers: { "Content-Type": MEDIA_TYPES.markdown } });
