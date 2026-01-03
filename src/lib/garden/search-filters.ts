import type { GardenEntry, GardenEntryTypeId } from "./entries";
import type { EntryType } from "./config";
import config from "garden.config";

/**
 * Context object passed to filters containing all filter parameters
 */
export interface FilterContext {
  query?: string;
  entryTypes?: GardenEntryTypeId[];
  statuses?: string[];
  topics?: string[];
  entryTypeConfigs?: Map<string, EntryType>;
}

/**
 * A filter function that takes entries and a context, returning filtered entries
 */
export type SearchFilter = (entries: GardenEntry[], context: FilterContext) => GardenEntry[];

/**
 * Creates a filter that filters entries by their entry type/collection
 * Only entries matching the provided entry types will be included
 */
export function createEntryTypeFilter(entryTypes?: GardenEntryTypeId[]): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext) => {
    // If no entry types specified, return all entries
    const typesToFilter = entryTypes ?? context.entryTypes;
    if (!typesToFilter || typesToFilter.length === 0) {
      return entries;
    }

    return entries.filter((entry) => typesToFilter.includes(entry.collection as GardenEntryTypeId));
  };
}

/**
 * Creates a filter that filters entries by their status (seedling, budding, evergreen)
 * Only entries matching the provided statuses will be included
 */
export function createStatusFilter(statuses?: string[]): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext) => {
    // If no statuses specified, return all entries
    const statusesToFilter = statuses ?? context.statuses;
    if (!statusesToFilter || statusesToFilter.length === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      return entry.data.status && statusesToFilter.includes(entry.data.status);
    });
  };
}

/**
 * Creates a filter that filters entries by topic IDs
 * Only entries that have at least one of the provided topic IDs will be included
 */
export function createTopicFilter(topics?: string[]): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext) => {
    // If no topics specified, return all entries
    const topicsToFilter = topics ?? context.topics;
    if (!topicsToFilter || topicsToFilter.length === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      // Check if entry has topics property
      if (!("topics" in entry.data) || !entry.data.topics) {
        return false;
      }

      // Check if any of the entry's topics match the filter
      const entryTopics = entry.data.topics as Array<{ id: string }>;
      return entryTopics.some((topic) => topicsToFilter.includes(topic.id));
    });
  };
}

/**
 * Creates a filter that filters entries by text query using each entry type's filterFn
 * If query is empty, returns all entries unchanged
 */
export function createQueryFilter(query?: string): SearchFilter {
  return (entries: GardenEntry[], context: FilterContext) => {
    const searchQuery = query ?? context.query;

    // If no query, return all entries
    if (!searchQuery || searchQuery.length === 0) {
      return entries;
    }

    // Get entry type configs from context or build them
    const entryTypeConfigs = context.entryTypeConfigs ?? getEntryTypeConfigsMap();

    return entries.filter((entry) => {
      const entryTypeConfig = entryTypeConfigs.get(entry.collection);

      // If entry type doesn't have search config, exclude it
      if (!entryTypeConfig?.search) {
        return false;
      }

      // Use the entry type's filter function
      return entryTypeConfig.search.filterFn(entry, searchQuery);
    });
  };
}

/**
 * Helper function to build a map of entry type IDs to their configurations
 */
function getEntryTypeConfigsMap(): Map<string, EntryType> {
  const map = new Map<string, EntryType>();

  config.sources.forEach((source) => {
    source.entryTypes.forEach((entryType) => {
      map.set(entryType.id, entryType);
    });
  });

  return map;
}

/**
 * Applies multiple filters progressively to a set of entries
 * Filters are applied in the order they are provided
 */
export function applyFilters(entries: GardenEntry[], filters: SearchFilter[], context: FilterContext): GardenEntry[] {
  return filters.reduce((filteredEntries, filter) => {
    return filter(filteredEntries, context);
  }, entries);
}
