import type { GardenEntry } from "./entries";
import type { EntryType } from "./config";
import { getEntry, getRelatedEntries, getEntryIndexRecord, type GardenEntryTypeId } from "./entries";

export interface FilterContext {
  entryType: EntryType;
  name?: string;
  status?: string[];
  topics?: string[];
  cuisine?: string[];
  diet?: string[];
  recipeType?: string[];
  relatedTo?: string;
}

export type SearchFilter = (entries: GardenEntry[], context: FilterContext) => Promise<GardenEntry[]>;

export async function applyFilters(
  entries: GardenEntry[],
  filters: SearchFilter[],
  context: FilterContext
): Promise<GardenEntry[]> {
  let filteredEntries = entries;
  for (const filter of filters) {
    filteredEntries = await filter(filteredEntries, context);
  }
  return filteredEntries;
}

export function createNameFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
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
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
    const selectedValues = context.status;

    if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
      return entries;
    }

    return entries.filter((entry) => selectedValues.includes(entry.data.status));
  };
}

export function createTopicFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
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

export function createCuisineFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
    const selectedValues = context.cuisine;

    if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      if (entry.collection === "recipes" && "cuisine" in entry.data) {
        const entryCuisine = entry.data.cuisine as string;
        return selectedValues.includes(entryCuisine);
      }

      return true;
    });
  };
}

export function createDietFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
    const selectedValues = context.diet;

    if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      if (entry.collection === "recipes" && "diets" in entry.data) {
        const entryDiets = (entry.data.diets ?? []) as string[];
        return entryDiets.length > 0 && entryDiets.some((diet: string) => selectedValues.includes(diet));
      }

      return true;
    });
  };
}

export function createrecipeTypeFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
    const selectedValues = context.recipeType;

    if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      if (entry.collection === "recipes" && "type" in entry.data) {
        const entryType = entry.data.type as string;
        return selectedValues.includes(entryType);
      }

      return true;
    });
  };
}

export function createRelatedToFilter(): SearchFilter {
  return async (entries: GardenEntry[], context: FilterContext): Promise<GardenEntry[]> => {
    const relatedToId = context.relatedTo;

    if (!relatedToId) {
      return entries;
    }

    const indexRecord = getEntryIndexRecord(relatedToId);
    const entry = await getEntry(indexRecord.type as GardenEntryTypeId, relatedToId);

    if (!entry) {
      return [];
    }

    const relatedEntries = await getRelatedEntries(entry);
    const relatedEntryIds = new Set(relatedEntries.map((e) => e.id));

    return entries.filter((entry) => relatedEntryIds.has(entry.id));
  };
}
