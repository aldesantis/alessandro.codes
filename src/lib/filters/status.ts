import type { GardenEntry } from "../zendo/entries";
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
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => selectedValues.includes(entry.data.status));
    },
  };
}
