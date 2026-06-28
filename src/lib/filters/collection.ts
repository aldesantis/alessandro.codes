import type { ZendoCollectionConfig, FilterConfig } from "zendo";
import type { ZendoCollectionId, ZendoCollectionEntry } from "src/garden";

export default async function collectionFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "collections",
    ui: {
      label: "Type",
      getItems: async () => [
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
    collectionFilterFn: async (
      entryTypes: ZendoCollectionConfig<ZendoCollectionEntry>[],
      value: unknown
    ): Promise<ZendoCollectionConfig<ZendoCollectionEntry>[]> => {
      const selectedCollections = value as ZendoCollectionId[] | undefined;

      if (!selectedCollections || selectedCollections.length === 0) {
        return entryTypes;
      }

      return entryTypes.filter((entryType) => selectedCollections.includes(entryType.id as ZendoCollectionId));
    },
  };
}
