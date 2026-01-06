import { getCollection, type CollectionEntry } from "astro:content";
import config, { entryTypeIds } from "garden.config";
import type { EntryType } from "src/lib/zendo/config";

import entryIndex from "src/data/index.json";

export type GardenEntryTypeId = (typeof entryTypeIds)[number];
export type GardenEntry = CollectionEntry<GardenEntryTypeId>;

export interface EntryLink {
  slug: string;
  type: string;
}

export interface EntryIndexRecord {
  ids: string[];
  slug: string;
  type: string;
  outboundLinks: EntryLink[];
  inboundLinks: EntryLink[];
}

function sortEntries(a: GardenEntry, b: GardenEntry): number {
  const statusPriorities = {
    seedling: 0,
    budding: 1,
    evergreen: 2,
  };

  if (a.data.updatedAt! > b.data.updatedAt!) {
    return -1;
  }

  if (a.data.updatedAt! < b.data.updatedAt!) {
    return 1;
  }

  const statusPriorityA = statusPriorities[a.data.status];
  const statusPriorityB = statusPriorities[b.data.status];

  return statusPriorityA > statusPriorityB ? -1 : 1;
}

export async function getEntries<T extends GardenEntryTypeId>(contentTypes: T[]): Promise<CollectionEntry<T>[]> {
  const allContent = await Promise.all(
    contentTypes.map(async (contentTypeId) => {
      const collection = await getCollection(contentTypeId);
      return collection;
    })
  ).then((collections) => collections.flat());

  const sortedContent = allContent.sort(sortEntries);

  return sortedContent;
}

export async function getEntry<T extends GardenEntryTypeId>(
  contentTypeId: T,
  entryId: string
): Promise<GardenEntry | null> {
  const entries = await getCollection(contentTypeId);

  const entry = entries.find((entry) => entry.id === entryId);

  if (!entry) {
    return null;
  }

  return entry;
}

export function getEntryIndexRecord(entryId: string): EntryIndexRecord {
  const indexRecord = entryIndex.find((entry) => entry.slug === entryId || entry.ids.includes(entryId));

  if (!indexRecord) {
    throw new Error(`Index record not found for entry ${entryId}`);
  }

  return indexRecord;
}

export async function getRelatedEntries(entry: GardenEntry): Promise<GardenEntry[]> {
  const indexRecord = getEntryIndexRecord(entry.id);

  if (!indexRecord) {
    return [];
  }

  const { outboundLinks, inboundLinks } = indexRecord;

  const allLinks = [...outboundLinks, ...inboundLinks];
  const uniqueLinks = Array.from(new Set(allLinks.map((link) => link.slug)))
    .map((slug) => allLinks.find((link) => link.slug === slug))
    .filter((link) => link !== undefined);

  const relatedEntries = (
    await Promise.all(uniqueLinks.map((link) => getEntry(link.type as GardenEntryTypeId, link.slug)))
  ).filter((entry): entry is GardenEntry => entry !== null);

  if (entry.collection === "topics") {
    const relatedEntriesByTopic = (await getEntries([...entryTypeIds])).filter(
      (e) => "topics" in e.data && e.data.topics?.some((t: { id: string }) => t.id === entry.id)
    );

    relatedEntries.push(...relatedEntriesByTopic);
  }

  const uniqueEntries = Array.from(new Set(relatedEntries.map((entry) => entry.id)))
    .map((id) => relatedEntries.find((entry) => entry.id === id))
    .filter((entry): entry is GardenEntry => entry !== undefined);

  return uniqueEntries.sort(sortEntries);
}

export function getEntryTypeConfiguration(entryTypeId: GardenEntryTypeId): EntryType {
  const entryTypeConfig = config.sources
    .flatMap((source) => source.entryTypes)
    .find((entryType) => entryType.id === entryTypeId);

  if (!entryTypeConfig) {
    throw new Error(`Entry type configuration not found for entry type ${entryTypeId}`);
  }

  return entryTypeConfig;
}
