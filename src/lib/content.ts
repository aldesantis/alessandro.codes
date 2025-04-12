import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as mdxContainerRenderer } from "@astrojs/mdx";
import {
  render,
  type AnyEntryMap,
  type CollectionEntry,
  getCollection,
} from "astro:content";
import { loadRenderers } from "astro:container";
import * as cheerio from "cheerio";
import Link from "@components/ui/Link.astro";
import { getLinks } from "./links";

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

export async function getRelatedContent(
  entry: CollectionEntry<"essays" | "books" | "notes" | "topics">
): Promise<CollectionEntry<"essays" | "books" | "notes" | "topics">[]> {
  const { outboundLinks, inboundLinks } = getLinks(entry.id);

  const allLinks = [...outboundLinks, ...inboundLinks];
  const uniqueLinks = Array.from(new Set(allLinks.map((link) => link.slug)))
    .map((slug) => allLinks.find((link) => link.slug === slug))
    .filter((link): link is NonNullable<typeof link> => link !== undefined);

  const essays = await getCollection("essays");
  const books = await getCollection("books");
  const notes = await getCollection("notes");
  const topics = await getCollection("topics");

  return uniqueLinks
    .map((link) => {
      switch (link.contentType) {
        case "essays":
          return essays.find((e) => e.id === link.slug);
        case "books":
          return books.find((b) => b.id === link.slug);
        case "notes":
          return notes.find((n) => n.id === link.slug);
        case "topics":
          return topics.find((t) => t.id === link.slug);
        default:
          return null;
      }
    })
    .filter(
      (
        content
      ): content is CollectionEntry<"essays" | "books" | "notes" | "topics"> =>
        content !== null && content !== undefined
    )
    .sort((a, b) => {
      const dateA = new Date(a.data.updatedAt);
      const dateB = new Date(b.data.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
}
