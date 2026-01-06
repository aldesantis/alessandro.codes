import type { ZendoCollectionEntry } from "../zendo/content";
import type { FilterConfig } from "../zendo/config";

export default async function statusFilter(): Promise<FilterConfig> {
  return {
    id: "status",
    ui: {
      label: "Status",
      getItems: async () => [
        { id: "seedling", label: "🌱 Seedling" },
        { id: "budding", label: "🌿 Budding" },
        { id: "evergreen", label: "🌳 Evergreen" },
      ],
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => selectedValues.includes(entry.data.status));
    },
  };
}
