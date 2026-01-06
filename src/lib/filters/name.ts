import type { GardenEntry } from "../zendo/entries";
import type { FilterConfig } from "../zendo/config";

export default async function nameFilter(): Promise<FilterConfig> {
  return {
    id: "name",
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const name = value as string;

      if (name.length < 3) {
        return [];
      }

      return entries.filter((entry) => entry.data.title.toLowerCase().includes(name.toLowerCase()));
    },
  };
}
