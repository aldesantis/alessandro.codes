import Link from "@components/ui/Link.astro";
import { getCollection, type CollectionEntry } from "astro:content";

export function isInternalUrl(url: string): boolean {
  const base = new URL("https://alessandro.codes");
  return new URL(url, base).hostname === base.hostname;
}

export async function getSortedNows(): Promise<CollectionEntry<"nows">[]> {
  const nows = (await getCollection("nows")).sort((a, b) =>
    a.id > b.id ? -1 : 1
  );

  return nows;
}

export function getMdxComponents() {
  return {
    a: Link,
    Link: Link,
  };
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
