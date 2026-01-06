import type { GardenEntry } from "./entries";
import type { EntryType } from "./config";
import { getCollection } from "astro:content";
import { getEntry, getRelatedEntries, getEntryIndexRecord, type GardenEntryTypeId } from "./entries";

export type ContentFilter = (
  entries: GardenEntry[],
  value: unknown,
  { entryType }: { entryType: EntryType }
) => Promise<GardenEntry[]>;

export type CollectionFilter = (entryTypes: EntryType[], value: unknown) => Promise<EntryType[]>;

export async function applyContentFilters(
  entries: GardenEntry[],
  filters: ContentFilter[],
  value: unknown,
  { entryType }: { entryType: EntryType }
): Promise<GardenEntry[]> {
  let filteredEntries = entries;
  for (const filter of filters) {
    filteredEntries = await filter(filteredEntries, value, { entryType });
  }
  return filteredEntries;
}

export async function applyCollectionFilters(
  entryTypes: EntryType[],
  filters: CollectionFilter[],
  value: unknown
): Promise<EntryType[]> {
  let filteredEntryTypes = entryTypes;
  for (const filter of filters) {
    filteredEntryTypes = await filter(filteredEntryTypes, value);
  }
  return filteredEntryTypes;
}

export interface FilterConfig {
  id: string;
  ui?: {
    label: string;
    items: Array<{ id: string; label: string }>;
  };
  contentFilterFn?: ContentFilter;
  collectionFilterFn?: CollectionFilter;
}

export async function createStatusFilterConfig(): Promise<FilterConfig> {
  return {
    id: "status",
    ui: {
      label: "Status",
      items: [
        { id: "seedling", label: "🌱 Seedling" },
        { id: "budding", label: "🌿 Budding" },
        { id: "evergreen", label: "🌳 Evergreen" },
      ],
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => selectedValues.includes(entry.data.status));
    },
  };
}

export async function createCollectionFilterConfig(): Promise<FilterConfig> {
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

export async function createTopicFilterConfig(): Promise<FilterConfig> {
  const topics = await getCollection("topics");

  return {
    id: "topics",
    ui: {
      label: "Topic",
      items: topics.map((topic) => ({
        id: topic.id,
        label: topic.data.title,
      })),
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if ("topics" in entry.data) {
          const entryTopics = (entry.data.topics ?? []).map((t: { id: string }) => t.id);
          return entryTopics.length > 0 && entryTopics.some((topicId: string) => selectedValues.includes(topicId));
        }

        return false;
      });
    },
  };
}

export async function createCuisineFilterConfig(): Promise<FilterConfig> {
  return {
    id: "cuisine",
    ui: {
      label: "Cuisine",
      items: [
        { id: "tex-mex", label: "🌮 Tex-Mex" },
        { id: "mediterranean", label: "🫒 Mediterranean" },
        { id: "bbq", label: "🍖 BBQ" },
        { id: "asian", label: "🍜 Asian" },
        { id: "indian", label: "🍛 Indian" },
        { id: "american", label: "🍔 American" },
      ],
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "cuisine" in entry.data) {
          const entryCuisine = entry.data.cuisine as string;
          return selectedValues.includes(entryCuisine);
        }

        return true;
      });
    },
  };
}

export async function createDietFilterConfig(): Promise<FilterConfig> {
  return {
    id: "diet",
    ui: {
      label: "Diet",
      items: [
        { id: "omnivore", label: "🥩 Omnivore" },
        { id: "vegetarian", label: "🥬 Vegetarian" },
        { id: "vegan", label: "🌱 Vegan" },
        { id: "pescatarian", label: "🐟 Pescatarian" },
      ],
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "diets" in entry.data) {
          const entryDiets = (entry.data.diets ?? []) as string[];
          return entryDiets.length > 0 && entryDiets.some((diet: string) => selectedValues.includes(diet));
        }

        return true;
      });
    },
  };
}

export async function createRecipeTypeFilterConfig(): Promise<FilterConfig> {
  return {
    id: "recipeType",
    ui: {
      label: "Course",
      items: [
        { id: "starter", label: "🥗 Starter" },
        { id: "first-course", label: "🍝 First Course" },
        { id: "main-course", label: "🍽️ Main Course" },
        { id: "single-dish", label: "🍲 Single Dish" },
        { id: "sauce", label: "🍯 Sauce" },
        { id: "side", label: "🥔 Side" },
        { id: "dessert", label: "🍰 Dessert" },
        { id: "other", label: "🍴 Other" },
      ],
    },
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "type" in entry.data) {
          const entryType = entry.data.type as string;
          return selectedValues.includes(entryType);
        }

        return true;
      });
    },
  };
}

export async function createNameFilterConfig(): Promise<FilterConfig> {
  return {
    id: "name",
    contentFilterFn: async (
      entries: GardenEntry[],
      value: unknown,
      { entryType }: { entryType: EntryType }
    ): Promise<GardenEntry[]> => {
      const name = value as string | undefined;

      if (name === undefined || !entryType.search) {
        return entries;
      }

      if (name.length < 3) {
        return [];
      }

      return entries.filter((entry) => entry.data.title.toLowerCase().includes(name.toLowerCase()));
    },
  };
}

export async function createRelatedToFilterConfig(): Promise<FilterConfig> {
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
