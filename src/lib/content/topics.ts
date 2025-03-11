import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedTopics(): Promise<CollectionEntry<"topics">[]> {
  const topics = await getCollection("topics");

  return topics;
}
