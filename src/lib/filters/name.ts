import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";

export default async function nameFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "name",
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const name = value as string;

      if (name.length < 3) {
        return [];
      }

      return entries.filter((entry) => entry.data.title.toLowerCase().includes(name.toLowerCase()));
    },
  };
}
