import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedArticles(): Promise<
  CollectionEntry<"articles">[]
> {
  const articles = (await getCollection("articles")).sort((a, b) =>
    a.data.lastHighlightedOn! > b.data.lastHighlightedOn! ? -1 : 1
  );

  return articles;
}
