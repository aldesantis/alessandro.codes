import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { SearchResult } from "src/lib/garden/config";
import config, { entryTypeIds } from "garden.config";

type SearchResultResponse = SearchResult & {
  url: string;
};

async function getResults(
  query: string,
  { entryTypes }: { entryTypes?: GardenEntryTypeId[] }
): Promise<SearchResultResponse[]> {
  let searchableEntryTypes = config.sources
    .flatMap((source) => source.entryTypes)
    .filter((entryType) => entryType.search);

  if (entryTypes) {
    searchableEntryTypes = searchableEntryTypes.filter((entryType) =>
      entryTypes.includes(entryType.id as GardenEntryTypeId)
    );
  }

  const entryTypeIds = searchableEntryTypes.map((et) => et.id as GardenEntryTypeId);
  const entries = await getEntries(entryTypeIds);

  const items: SearchResultResponse[] = [];

  for (const entryType of searchableEntryTypes) {
    const entriesForType = entries.filter((e) => e.collection === entryType.id);
    const filteredEntries = entriesForType.filter((entry) => entryType.search!.filterFn(entry, query));
    const transformedItems = filteredEntries.map((entry) => entryType.search!.buildSearchResultFn(entry));

    items.push(...transformedItems.map((item) => ({ ...item, url: entryType.search!.buildUrlFn(item.id) })));
  }

  return items;
}

export const search = defineAction({
  input: z.object({
    query: z.string().default(""),
    entryTypes: z.array(z.enum(entryTypeIds)).optional(),
  }),
  handler: async ({ query, entryTypes }) => {
    if (!query || query.length < 3) {
      return { items: [] };
    }

    const items = await getResults(query, { entryTypes });

    return { items };
  },
});
