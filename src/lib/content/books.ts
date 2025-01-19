import { getCollection } from "astro:content";

export async function getSortedBooks() {
  const books = (await getCollection("books")).sort((a, b) =>
    new Date(a.data.lastHighlightedOn) > new Date(b.data.lastHighlightedOn)
      ? -1
      : 1
  );

  return books;
}
