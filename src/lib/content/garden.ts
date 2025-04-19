import { getCollection, type CollectionEntry } from "astro:content";

export type GardenContent = CollectionEntry<
  "essays" | "books" | "notes" | "topics" | "talks"
>;

function getContentDate(content: GardenContent): Date {
  if (content.collection === "books") {
    return new Date(content.data.lastHighlightedOn);
  }
  return new Date(content.data.updatedAt || content.data.createdAt);
}

export async function getSortedGardenContent(): Promise<GardenContent[]> {
  const essays = await getCollection("essays");
  const books = await getCollection("books");
  const notes = await getCollection("notes");
  const talks = await getCollection("talks");

  const allContent = [...essays, ...books, ...notes, ...talks];

  return allContent.sort((a, b) => {
    const dateA = getContentDate(a);
    const dateB = getContentDate(b);
    return dateB.getTime() - dateA.getTime();
  });
}
