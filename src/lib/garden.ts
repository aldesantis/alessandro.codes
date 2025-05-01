import { getCollection, type CollectionEntry } from "astro:content";
import links from "src/data/index.json";
import type { ImageMetadata } from "astro";
import type { GardenIndexEntryLink } from "src/lib/types/garden";

export type GardenEntryType = "essays" | "books" | "notes" | "topics" | "talks" | "nows";

export type GardenEntry = CollectionEntry<GardenEntryType>;

export interface GardenEntryLinks {
  outboundLinks: GardenIndexEntryLink[];
  inboundLinks: GardenIndexEntryLink[];
}

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

export async function getRelatedGardenEntries(entry: GardenEntry): Promise<GardenEntry[]> {
  const { outboundLinks, inboundLinks } = getGardenEntryLinks(entry.id);

  const allLinks = [...outboundLinks, ...inboundLinks];
  const uniqueLinks = Array.from(new Set(allLinks.map((link) => link.slug)))
    .map((slug) => allLinks.find((link) => link.slug === slug))
    .filter((link): link is NonNullable<typeof link> => link !== undefined);

  const essays = await getCollection("essays");
  const books = await getCollection("books");
  const notes = await getCollection("notes");
  const topics = await getCollection("topics");
  const talks = await getCollection("talks");
  const nows = await getCollection("nows");

  // Get entries that have this topic in their topics frontmatter
  const entriesWithTopic =
    entry.collection === "topics"
      ? [
          ...essays.filter((e) => e.data.topics?.some((t) => t.id === entry.id)),
          ...books.filter((b) => b.data.topics?.some((t) => t.id === entry.id)),
          ...notes.filter((n) => n.data.topics?.some((t) => t.id === entry.id)),
          ...talks.filter((t) => t.data.topics?.some((t) => t.id === entry.id)),
          ...nows.filter((n) => n.data.topics?.some((t) => t.id === entry.id)),
        ]
      : [];

  const linkedEntries = uniqueLinks
    .map((link) => {
      switch (link.type) {
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
        case "nows":
          return nows.find((n) => n.id === link.slug);
        default:
          return null;
      }
    })
    .filter((content): content is GardenEntry => content !== null && content !== undefined);

  // Combine linked entries with entries that have the topic
  const allRelatedEntries = [...linkedEntries, ...entriesWithTopic];

  // Remove duplicates based on entry ID
  const uniqueEntries = Array.from(new Set(allRelatedEntries.map((entry) => entry.id)))
    .map((id) => allRelatedEntries.find((entry) => entry.id === id))
    .filter((entry): entry is GardenEntry => entry !== undefined);

  return uniqueEntries.sort(sortGardenEntriesByDate);
}

export function getGardenEntryLinks(gardenEntryId: string): GardenEntryLinks {
  const gardenEntryData = links.find((entry) => entry.slug === gardenEntryId || entry.ids.includes(gardenEntryId));

  if (!gardenEntryData) {
    return { outboundLinks: [], inboundLinks: [] };
  }

  return {
    outboundLinks: gardenEntryData.outboundLinks,
    inboundLinks: gardenEntryData.inboundLinks,
  };
}

export async function getSortedEssays(): Promise<CollectionEntry<"essays">[]> {
  const essays = (await getCollection("essays")).sort((a, b) => (a.data.updatedAt! > b.data.updatedAt! ? -1 : 1));

  return essays;
}

export async function getSortedBooks() {
  const books = (await getCollection("books")).sort((a, b) =>
    new Date(a.data.lastHighlightedOn) > new Date(b.data.lastHighlightedOn) ? -1 : 1
  );

  return books;
}

export async function fetchBookCover(book: CollectionEntry<"books">): Promise<{ default: ImageMetadata }> {
  const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/covers/*.jpg");

  const cover = images[`/src/assets/covers/${book.id.toLowerCase()}.jpg`];

  if (!cover) {
    throw new Error(`Cannot find cover for ${book.id}`);
  }

  return await cover();
}

export async function getSortedTopics(): Promise<CollectionEntry<"topics">[]> {
  const topics = await getCollection("topics");

  return topics.sort((a, b) => {
    const dateA = new Date(a.data.updatedAt);
    const dateB = new Date(b.data.updatedAt);
    return dateB.getTime() - dateA.getTime();
  });
}

export function getYouTubeEmbedUrl(url: string): string {
  try {
    const videoUrl = new URL(url);
    const videoId = videoUrl.searchParams.get("v") || videoUrl.pathname.split("/").pop();

    if (!videoId) {
      console.warn(`Could not extract video ID from URL: ${url}`);
      return url;
    }

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

    const timestamp = videoUrl.searchParams.get("t");
    if (timestamp) {
      embedUrl.searchParams.set("start", timestamp.replace("s", ""));
    }

    return embedUrl.toString();
  } catch {
    console.warn(`Invalid URL format: ${url}`);
    return url;
  }
}

export async function getSortedTalks(): Promise<CollectionEntry<"talks">[]> {
  const talks = (await getCollection("talks")).sort((a, b) => (a.data.createdAt > b.data.createdAt ? -1 : 1));

  return talks;
}

export async function getSortedNotes() {
  const statusPriorities = {
    seedling: 0,
    budding: 1,
    evergreen: 2,
  };

  const notes = (await getCollection("notes")).sort((a, b) => {
    // First, compare by updatedAt in descending order
    if (a.data.updatedAt! > b.data.updatedAt!) return -1;
    if (a.data.updatedAt! < b.data.updatedAt!) return 1;

    // If updatedAt is the same, use status as a tiebreaker
    const statusPriorityA = statusPriorities[a.data.status];
    const statusPriorityB = statusPriorities[b.data.status];

    return statusPriorityA > statusPriorityB ? -1 : 1;
  });

  return notes;
}

export async function getSortedNows(): Promise<CollectionEntry<"nows">[]> {
  const nows = (await getCollection("nows")).sort((a, b) => (a.id > b.id ? -1 : 1));

  return nows;
}
