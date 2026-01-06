import type { GardenEntry } from "../zendo/entries";
import type { FilterConfig } from "../zendo/config";
import { getEntry, getRelatedEntries, getEntryIndexRecord, type GardenEntryTypeId } from "../zendo/entries";

export default async function relatedToFilter(): Promise<FilterConfig> {
  return {
    id: "relatedTo",
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
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
