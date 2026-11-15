import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";
import readingStatuses from "@components/content/books/statuses.json";

export default async function readingStatusFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "readingStatus",
    ui: {
      label: "Status",
      getItems: async () => Object.entries(readingStatuses).map(([id, label]) => ({ id, label })),
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => entry.collection === "books" && selectedValues.includes(entry.data.status));
    },
  };
}
