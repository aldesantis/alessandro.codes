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

      // Books and recipes have a status too, but on their own scales: see
      // readingStatus and recipeStatus.
      return entries.filter(
        (entry) =>
          entry.collection !== "books" &&
          entry.collection !== "recipes" &&
          "status" in entry.data &&
          selectedValues.includes(entry.data.status)
      );
    },
  };
}
