import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedBooks() {
  const books = (await getCollection("books")).sort((a, b) =>
    new Date(a.data.updatedAt) > new Date(b.data.updatedAt) ? -1 : 1
  );

  return books;
}

export async function fetchBookCover(
  book: CollectionEntry<"books">
): Promise<{ default: ImageMetadata }> {
  const images = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/covers/*.jpg"
  );

  const cover = images[`/src/assets/covers/${book.id.toLowerCase()}.jpg`];

  if (!cover) {
    throw new Error(`Cannot find cover for ${book.id}`);
  }

  return await cover();
}
