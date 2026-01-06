import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntry, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { SearchResult, EntryType } from "src/lib/garden/config";
import config from "garden.config";

type SearchResultResponse = SearchResult & {
  url: string;
};

async function applyCollectionFilters(entryTypes: EntryType[], params: Record<string, unknown>): Promise<EntryType[]> {
  if (!config.filters) {
    return [];
  }

  const filters = config.filters.filter((config) => config.collectionFilterFn !== undefined);

  let filteredEntryTypes = entryTypes;
  for (const filter of filters) {
    const paramValue = params[filter.id];
    if (paramValue !== undefined && filter.collectionFilterFn) {
      filteredEntryTypes = await filter.collectionFilterFn(filteredEntryTypes, paramValue);
    }
  }

  return filteredEntryTypes;
}

async function applyContentFilters(entries: GardenEntry[], params: Record<string, unknown>): Promise<GardenEntry[]> {
  if (!config.filters) {
    return [];
  }

  const filters = config.filters.filter((config) => config.contentFilterFn !== undefined);

  let filteredEntries = entries;
  for (const filter of filters) {
    const paramValue = params[filter.id];
    if (paramValue !== undefined && filter.contentFilterFn) {
      filteredEntries = await filter.contentFilterFn(filteredEntries, paramValue);
    }
  }

  return filteredEntries;
}

async function getResults(
  params: Record<string, unknown>,
  { limit }: { limit?: number }
): Promise<SearchResultResponse[]> {
  const searchableCollections = config.sources
    .flatMap((source) => source.entryTypes)
    .filter((entryType) => entryType.search);

  if (searchableCollections.length === 0) {
    return [];
  }

  if (!config.filters) {
    return [];
  }

  const collections = await applyCollectionFilters(searchableCollections, params);

  const searchResults: SearchResultResponse[] = await Promise.all(
    collections.map(async (collection) => {
      const entries = await getEntries([collection.id as GardenEntryTypeId]);
      const filteredEntries = await applyContentFilters(entries, params);

      return filteredEntries.map((entry) => ({
        ...collection.search!.buildSearchResultFn(entry),
        url: collection.search!.buildUrlFn(entry.id),
      }));
    })
  ).then((results) => results.flat());

  return searchResults.slice(0, limit);
}

export const search = defineAction({
  input: z
    .object({
      limit: z.number().optional(),
    })
    .passthrough(),
  handler: async (params) => {
    const { limit, ...filterParams } = params;

    const items = await getResults(filterParams, { limit });

    return { items };
  },
});
