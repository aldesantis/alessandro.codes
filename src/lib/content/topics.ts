import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedTopics(): Promise<CollectionEntry<"topics">[]> {
  const topics = await getCollection("topics");

  return topics.sort((a, b) => {
    const dateA = new Date(a.data.updatedAt);
    const dateB = new Date(b.data.updatedAt);
    return dateB.getTime() - dateA.getTime();
  });
}
