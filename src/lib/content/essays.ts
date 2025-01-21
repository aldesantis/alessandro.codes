import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedEssays(): Promise<CollectionEntry<"essays">[]> {
  const essays = (await getCollection("essays")).sort((a, b) =>
    a.data.publishedOn > b.data.publishedOn ? -1 : 1
  );

  return essays;
}
