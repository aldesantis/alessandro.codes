import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { SearchResult } from "src/lib/garden/config";
import config, { entryTypeIds } from "garden.config";
import {
  applyFilters,
  createNameFilter,
  createStatusFilter,
  createTopicFilter,
  createCuisineFilter,
  createDietFilter,
  createRecipeTypeFilter,
  createRelatedToFilter,
} from "src/lib/garden/search-filters";

type SearchResultResponse = SearchResult & {
  url: string;
};

async function getResults(
  {
    name,
    status,
    topics,
    cuisine,
    diet,
    recipeType,
    relatedTo,
  }: {
    name?: string;
    status?: string[];
    topics?: string[];
    cuisine?: string[];
    diet?: string[];
    recipeType?: string[];
    relatedTo?: string;
  },
  { collections }: { collections: GardenEntryTypeId[] },
  { limit }: { limit?: number }
): Promise<SearchResultResponse[]> {
  const entryTypes = config.sources
    .flatMap((source) => source.entryTypes)
    .filter((entryType) => entryType.search)
    .filter((entryType) => collections.includes(entryType.id as GardenEntryTypeId));
  const entries = await getEntries(entryTypes.map((et) => et.id as GardenEntryTypeId));

  const searchResults: SearchResultResponse[] = [];

  const filters = [
    createNameFilter(),
    createStatusFilter(),
    createTopicFilter(),
    createCuisineFilter(),
    createDietFilter(),
    createRecipeTypeFilter(),
    createRelatedToFilter(),
  ];

  for (const entryType of entryTypes) {
    const entriesForType = entries.filter((e) => e.collection === entryType.id);

    const filteredEntries = await applyFilters(entriesForType, filters, {
      name,
      entryType,
      status,
      topics,
      cuisine,
      diet,
      recipeType,
      relatedTo,
    });

    const searchResultsForType = filteredEntries.map((entry) => entryType.search!.buildSearchResultFn(entry));

    searchResults.push(
      ...searchResultsForType.map((item) => ({ ...item, url: entryType.search!.buildUrlFn(item.id) }))
    );
  }

  return limit !== undefined ? searchResults.slice(0, limit) : searchResults;
}

export const search = defineAction({
  input: z.object({
    name: z.string().optional(),
    collections: z.array(z.enum(entryTypeIds)).default([...entryTypeIds]),
    limit: z.number().optional(),
    status: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
    cuisine: z.array(z.string()).optional(),
    diet: z.array(z.string()).optional(),
    recipeType: z.array(z.string()).optional(),
    relatedTo: z.string().optional(),
  }),
  handler: async ({ name, collections, limit, status, topics, cuisine, diet, recipeType, relatedTo }) => {
    const items = await getResults(
      { name, status, topics, cuisine, diet, recipeType, relatedTo },
      { collections },
      { limit }
    );

    return { items };
  },
});
