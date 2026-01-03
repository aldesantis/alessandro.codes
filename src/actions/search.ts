import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { SearchResult } from "src/lib/garden/config";
import config, { entryTypeIds } from "garden.config";
import {
  createEntryTypeFilter,
  createStatusFilter,
  createTopicFilter,
  createQueryFilter,
  applyFilters,
  type FilterContext,
} from "src/lib/garden/search-filters";

type SearchResultResponse = SearchResult & {
  url: string;
};

async function getResults(
  query: string,
  {
    entryTypes,
    statuses,
    topics,
  }: {
    entryTypes?: GardenEntryTypeId[];
    statuses?: string[];
    topics?: string[];
  }
): Promise<SearchResultResponse[]> {
  // Get all searchable entry types
  const searchableEntryTypes = config.sources
    .flatMap((source) => source.entryTypes)
    .filter((entryType) => entryType.search);

  // Build entry type configs map for filter context
  const entryTypeConfigsMap = new Map(searchableEntryTypes.map((entryType) => [entryType.id, entryType]));

  // If entry types are specified, filter to only those that are searchable
  const filteredEntryTypes = entryTypes
    ? searchableEntryTypes.filter((entryType) => entryTypes.includes(entryType.id as GardenEntryTypeId))
    : searchableEntryTypes;

  const entryTypeIds = filteredEntryTypes.map((et) => et.id as GardenEntryTypeId);
  const entries = await getEntries(entryTypeIds);

  // Build filter context
  const context: FilterContext = {
    query,
    entryTypes: entryTypes ?? entryTypeIds,
    statuses,
    topics,
    entryTypeConfigs: entryTypeConfigsMap,
  };

  // Build filter pipeline
  const filters = [
    createEntryTypeFilter(entryTypes),
    createStatusFilter(statuses),
    createTopicFilter(topics),
    createQueryFilter(query),
  ];

  // Apply filters progressively
  const filteredEntries = applyFilters(entries, filters, context);

  // Transform filtered entries to search results
  const items: SearchResultResponse[] = [];

  for (const entry of filteredEntries) {
    const entryType = entryTypeConfigsMap.get(entry.collection);

    if (!entryType?.search) {
      continue;
    }

    const searchResult = entryType.search.buildSearchResultFn(entry);
    const url = entryType.search.buildUrlFn(searchResult.id);

    items.push({ ...searchResult, url });
  }

  console.log(items);

  return items;
}

export const search = defineAction({
  input: z.object({
    query: z.string().default(""),
    entryTypes: z.array(z.enum(entryTypeIds)).optional(),
    statuses: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
  }),
  handler: async ({ query, entryTypes, statuses, topics }) => {
    const items = await getResults(query, { entryTypes, statuses, topics });

    return { items };
  },
});
