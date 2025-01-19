import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedNows(): Promise<CollectionEntry<"nows">[]> {
  const nows = (await getCollection("nows")).sort((a, b) =>
    a.id > b.id ? -1 : 1
  );

  return nows;
}
