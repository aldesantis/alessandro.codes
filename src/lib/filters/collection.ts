import type { EntryType, FilterConfig } from "../zendo/config";
import type { GardenEntryTypeId } from "../zendo/entries";

export default async function collectionFilter(): Promise<FilterConfig> {
  return {
    id: "collections",
    ui: {
      label: "Type",
      items: [
        { id: "essays", label: "Essays" },
        { id: "books", label: "Books" },
        { id: "notes", label: "Notes" },
        { id: "talks", label: "Talks" },
        { id: "topics", label: "Topics" },
        { id: "recipes", label: "Recipes" },
        { id: "articles", label: "Articles" },
        { id: "nows", label: "Now" },
      ],
    },
    collectionFilterFn: async (entryTypes: EntryType[], value: unknown): Promise<EntryType[]> => {
      const selectedCollections = value as GardenEntryTypeId[] | undefined;

      if (!selectedCollections || selectedCollections.length === 0) {
        return entryTypes;
      }

      return entryTypes.filter((entryType) => selectedCollections.includes(entryType.id as GardenEntryTypeId));
    },
  };
}
