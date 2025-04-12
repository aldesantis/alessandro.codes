import { getCollection, type CollectionEntry } from "astro:content";

export function getYouTubeEmbedUrl(url: string): string {
  try {
    const videoUrl = new URL(url);
    const videoId =
      videoUrl.searchParams.get("v") || videoUrl.pathname.split("/").pop();

    if (!videoId) {
      console.warn(`Could not extract video ID from URL: ${url}`);
      return url;
    }

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

    const timestamp = videoUrl.searchParams.get("t");
    if (timestamp) {
      embedUrl.searchParams.set("start", timestamp.replace("s", ""));
    }

    return embedUrl.toString();
  } catch (error) {
    console.warn(`Invalid URL format: ${url}`);
    return url;
  }
}

export async function getSortedTalks(): Promise<CollectionEntry<"talks">[]> {
  const talks = (await getCollection("talks")).sort((a, b) =>
    a.data.createdAt > b.data.createdAt ? -1 : 1
  );

  return talks;
}
