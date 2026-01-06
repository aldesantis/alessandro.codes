import type { ZendoCollectionEntry, ZendoCollectionId } from "src/lib/zendo/content";
import type { FilterConfig } from "src/lib/zendo/config";

export default async function relatedToFilter(): Promise<FilterConfig> {
  return {
    id: "relatedTo",
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const { getEntry, getRelatedEntries, getEntryIndexRecord } = await import("../zendo/content");
      const relatedToId = value as string | undefined;

      if (!relatedToId) {
        return entries;
      }

      const indexRecord = getEntryIndexRecord(relatedToId);
      const entry = await getEntry(indexRecord.type as ZendoCollectionId, relatedToId);

      if (!entry) {
        return [];
      }

      const relatedEntries = await getRelatedEntries(entry);
      const relatedEntryIds = new Set(relatedEntries.map((e) => e.id));

      return entries.filter((entry) => relatedEntryIds.has(entry.id));
    },
  };
}
