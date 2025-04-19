import { type CollectionEntry, getCollection } from "astro:content";
import { getLinks } from "src/lib/links";

export type GardenEntry = CollectionEntry<
  "essays" | "books" | "notes" | "topics" | "talks"
>;

function getGardenEntryDate(content: GardenEntry): Date {
  if (content.collection === "books") {
    return new Date(content.data.lastHighlightedOn);
  }
  return new Date(content.data.updatedAt || content.data.createdAt);
}

function sortGardenEntriesByDate(a: GardenEntry, b: GardenEntry): number {
  const dateA = getGardenEntryDate(a);
  const dateB = getGardenEntryDate(b);
  return dateB.getTime() - dateA.getTime();
}

export async function getSortedGardenEntries(): Promise<GardenEntry[]> {
  const essays = await getCollection("essays");
  const books = await getCollection("books");
  const notes = await getCollection("notes");
  const talks = await getCollection("talks");

  const allContent = [...essays, ...books, ...notes, ...talks];

  return allContent.sort(sortGardenEntriesByDate);
}

export async function getRelatedGardenEntries(
  entry: GardenEntry
): Promise<GardenEntry[]> {
  const { outboundLinks, inboundLinks } = getLinks(entry.id);

  const allLinks = [...outboundLinks, ...inboundLinks];
  const uniqueLinks = Array.from(new Set(allLinks.map((link) => link.slug)))
    .map((slug) => allLinks.find((link) => link.slug === slug))
    .filter((link): link is NonNullable<typeof link> => link !== undefined);

  const essays = await getCollection("essays");
  const books = await getCollection("books");
  const notes = await getCollection("notes");
  const topics = await getCollection("topics");
  const talks = await getCollection("talks");

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
        case "talks":
          return talks.find((t) => t.id === link.slug);
        default:
          return null;
      }
    })
    .filter(
      (content): content is GardenEntry =>
        content !== null && content !== undefined
    )
    .sort(sortGardenEntriesByDate);
}
