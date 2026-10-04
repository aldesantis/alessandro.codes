import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as mdxContainerRenderer } from "@astrojs/mdx/container-renderer";
import { render } from "astro:content";
import { loadRenderers } from "astro:container";
import * as cheerio from "cheerio";
import Link from "@components/ui/Link.astro";
import Tldr from "@components/content/Tldr.astro";
import Figure from "@components/viz/Figure.astro";
import type { ZendoCollectionEntry } from "src/garden";

export async function renderToString(entry: ZendoCollectionEntry): Promise<string> {
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

// A paragraph made only of Obsidian tags, e.g. "#change-management #strategy".
const TAGS_ONLY = /^(?:#[\p{L}\p{N}_/-]+\s*)+$/u;

/**
 * Plain text of the first paragraph worth showing as an excerpt: skips empty
 * paragraphs, tag-only lines and footnote definitions, and drops footnote
 * reference markers. Returns "" when there's nothing to show.
 */
export function getFirstParagraph(html: string): string {
  const $ = cheerio.load(html);
  $("sup, a[data-footnote-ref], section[data-footnotes]").remove();

  for (const paragraph of $("p").toArray()) {
    const text = $(paragraph).text().replace(/\s+/g, " ").trim();
    if (text && !TAGS_ONLY.test(text)) return text;
  }

  return "";
}

export function getMdxComponents() {
  return {
    a: Link,
    Link: Link,
    Tldr: Tldr,
    Figure: Figure,
  };
}
