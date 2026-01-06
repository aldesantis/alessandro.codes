import type { GardenEntry } from "../zendo/entries";
import type { FilterConfig } from "../zendo/config";
import { getCollection } from "astro:content";

export default async function topicFilter(): Promise<FilterConfig> {
  const topics = await getCollection("topics");

  return {
    id: "topics",
    ui: {
      label: "Topic",
      items: topics.map((topic) => ({
        id: topic.id,
        label: topic.data.title,
      })),
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if ("topics" in entry.data) {
          const entryTopics = (entry.data.topics ?? []).map((t: { id: string }) => t.id);
          return entryTopics.length > 0 && entryTopics.some((topicId: string) => selectedValues.includes(topicId));
        }

        return false;
      });
    },
  };
}
