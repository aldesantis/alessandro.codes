import type { GardenEntry } from "./entries";
import type { EntryType } from "./config";

export interface FilterContext {
  entryType: EntryType;
  name?: string;
  status?: string[];
  topics?: string[];
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

export function createStatusFilter(): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext): GardenEntry[] => {
    const selectedValues = context.status;

    if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
      return entries;
    }

    return entries.filter((entry) => selectedValues.includes(entry.data.status));
  };
}

export function createTopicFilter(): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext): GardenEntry[] => {
    const selectedValues = context.topics;

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
  };
}
