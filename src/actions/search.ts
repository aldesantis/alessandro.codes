import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { SearchResult } from "src/lib/garden/config";
import config, { entryTypeIds } from "garden.config";

type SearchResultResponse = SearchResult & {
  url: string;
};

async function getResults(
  params: Record<string, unknown>,
  { limit }: { limit?: number }
): Promise<SearchResultResponse[]> {
  const allEntryTypes = config.sources.flatMap((source) => source.entryTypes).filter((entryType) => entryType.search);

  if (allEntryTypes.length === 0) {
    return [];
  }

  if (!config.filters) {
    return [];
  }

  const collectionFilterConfigs = config.filters.filter((config) => config.collectionFilterFn !== undefined);

  let entryTypes = allEntryTypes;
  for (const filterConfig of collectionFilterConfigs) {
    const paramValue = params[filterConfig.id];
    if (paramValue !== undefined && filterConfig.collectionFilterFn) {
      entryTypes = await filterConfig.collectionFilterFn(entryTypes, paramValue);
    }
  }

  const entries = await getEntries(entryTypes.map((et) => et.id as GardenEntryTypeId));

  const searchResults: SearchResultResponse[] = [];

  const contentFilterConfigs = config.filters.filter((config) => config.contentFilterFn !== undefined);

  for (const entryType of entryTypes) {
    const entriesForType = entries.filter((e) => e.collection === entryType.id);

    let filteredEntries = entriesForType;
    for (const filterConfig of contentFilterConfigs) {
      const paramValue = params[filterConfig.id];
      if (paramValue !== undefined && filterConfig.contentFilterFn) {
        filteredEntries = await filterConfig.contentFilterFn(filteredEntries, paramValue, { entryType });
      }
    }

    const searchResultsForType = filteredEntries.map((entry) => entryType.search!.buildSearchResultFn(entry));

    searchResults.push(
      ...searchResultsForType.map((item) => ({ ...item, url: entryType.search!.buildUrlFn(item.id) }))
    );
  }

  return limit !== undefined ? searchResults.slice(0, limit) : searchResults;
}

export const search = defineAction({
  input: z
    .object({
      limit: z.number().optional(),
    })
    .passthrough(), // Allow additional properties that match filter IDs
  handler: async (params) => {
    const { limit, ...filterParams } = params;

    // Apply default for collections if not provided
    if (!filterParams.collections) {
      filterParams.collections = [...entryTypeIds];
    }

    const items = await getResults(filterParams, { limit });

    return { items };
  },
});
