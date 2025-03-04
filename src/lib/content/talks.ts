import { getCollection, type CollectionEntry } from "astro:content";

export function getYouTubeEmbedUrl(url: string): string {
  const videoIdMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/
  );
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) {
    console.warn(`Could not extract video ID from URL: ${url}`);
    return url;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

export async function getSortedTalks(): Promise<CollectionEntry<"talks">[]> {
  const talks = (await getCollection("talks")).sort((a, b) =>
    a.data.date > b.data.date ? -1 : 1
  );

  return talks;
}
