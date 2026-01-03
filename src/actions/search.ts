import { defineAction } from "astro:actions";
import { z } from "astro/zod";

import { getEntries, type GardenEntryTypeId } from "src/lib/garden/entries";
import type { ContentItem } from "src/lib/garden/config";
import config from "garden.config";

async function getCommandPaletteItems(query: string): Promise<ContentItem[]> {
  const entryTypesWithSearch = config.sources
    .flatMap((source) => source.entryTypes)
    .filter((entryType) => entryType.search);

  const entryTypeIds = entryTypesWithSearch.map((et) => et.id as GardenEntryTypeId);
  const entries = await getEntries(entryTypeIds);

  const items: ContentItem[] = [];

  for (const entryType of entryTypesWithSearch) {
    if (!entryType.search) {
      continue;
    }

    const entriesForType = entries.filter((e) => e.collection === entryType.id);
    const filteredEntries = entriesForType.filter((entry) => entryType.search!.filter(entry, query));
    const transformedItems = filteredEntries.map((entry) => entryType.search!.toCommandPaletteItem(entry));

    items.push(...transformedItems);
  }

  return items;
}

export const search = defineAction({
  input: z.object({
    query: z.string().default(""),
  }),
  handler: async ({ query }) => {
    if (!query || query.length < 3) {
      return { items: [] };
    }

    const items = await getCommandPaletteItems(query);

    return { items };
  },
});
