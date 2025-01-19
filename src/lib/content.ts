import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as mdxContainerRenderer } from "@astrojs/mdx";
import { render, type AnyEntryMap, type CollectionEntry } from "astro:content";
import { loadRenderers } from "astro:container";
import * as cheerio from "cheerio";
import Link from "@components/ui/Link.astro";

export async function renderToString(
  entry: CollectionEntry<keyof AnyEntryMap>
): Promise<string> {
  const renderers = await loadRenderers([mdxContainerRenderer()]);
  const container = await AstroContainer.create({
    renderers,
  });

  const { Content } = await render(entry);
  const entryHtml = await container.renderToString(Content, {
    props: { components: getMdxComponents() },
  });

  return entryHtml;
}

export function getFirstParagraph(html: string): string {
  const $ = cheerio.load(html);
  const firstParagraph = $("p").first();
  return firstParagraph.text() || "";
}

export function getMdxComponents() {
  return {
    a: Link,
    Link: Link,
  };
}
