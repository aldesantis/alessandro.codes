import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";

export default async function statusFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
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
