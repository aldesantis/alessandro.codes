import type { GardenEntry, GardenEntryTypeId } from "src/lib/zendo/entries";
import type { FilterConfig } from "src/lib/zendo/config";

export default async function relatedToFilter(): Promise<FilterConfig> {
  return {
    id: "relatedTo",
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const { getEntry, getRelatedEntries, getEntryIndexRecord } = await import("../zendo/entries");
      const relatedToId = value as string | undefined;

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
    },
  };
}
