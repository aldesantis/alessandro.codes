import type { GardenEntry } from "./entries";
import type { EntryType } from "./config";

export interface FilterContext {
  name: string | undefined;
  entryType: EntryType;
}

export type SearchFilter = (entries: GardenEntry[], context: FilterContext) => GardenEntry[];

export function applyFilters(entries: GardenEntry[], filters: SearchFilter[], context: FilterContext): GardenEntry[] {
  return filters.reduce((filteredEntries, filter) => filter(filteredEntries, context), entries);
}

export function createNameFilter(): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext): GardenEntry[] => {
    const { entryType, name } = context;

    if (name === undefined || !entryType.search) {
      return entries;
    }

    if (name.length < 3) {
      return [];
    }

    return entries.filter((entry) => entry.data.title.toLowerCase().includes(name.toLowerCase()));
  };
}
