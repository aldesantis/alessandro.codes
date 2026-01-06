import { getCollection, type CollectionEntry } from "astro:content";
import config, { collectionIds as collectionIds } from "garden.config";
import type { ZendoCollectionConfig } from "src/lib/zendo/config";

import entryIndex from "src/data/index.json";

export type ZendoCollectionId = (typeof collectionIds)[number];
export type ZendoCollectionEntry = CollectionEntry<ZendoCollectionId>;

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

export async function getEntries<T extends ZendoCollectionId>(contentTypes: T[]): Promise<CollectionEntry<T>[]> {
  const allEntries = await Promise.all(
    contentTypes.map(async (contentTypeId) => {
      const collection = await getCollection(contentTypeId);
      return collection;
    })
  ).then((collections) => collections.flat());

  const sortedEntries = allEntries.sort(config.sortEntriesFn);

  return sortedEntries;
}

export async function getEntry<T extends ZendoCollectionId>(
  collectionId: T,
  entryId: string
): Promise<ZendoCollectionEntry | null> {
  const entries = await getCollection(collectionId);

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

export async function getRelatedEntries(entry: ZendoCollectionEntry): Promise<ZendoCollectionEntry[]> {
  const indexRecord = getEntryIndexRecord(entry.id);

  if (!indexRecord) {
    return [];
  }

  const { outboundLinks, inboundLinks } = indexRecord;

  const allLinks = [...outboundLinks, ...inboundLinks];
  const uniqueLinks = Array.from(new Set(allLinks.map((link) => link.slug)))
    .map((slug) => allLinks.find((link) => link.slug === slug))
    .filter((link) => link !== undefined);

  const relatedEntriesByLinks = (
    await Promise.all(uniqueLinks.map((link) => getEntry(link.type as ZendoCollectionId, link.slug)))
  ).filter((entry): entry is ZendoCollectionEntry => entry !== null);

  if (entry.collection === "topics") {
    const relatedEntriesByTopic = (await getEntries([...collectionIds])).filter(
      (e) => "topics" in e.data && e.data.topics?.some((t: { id: string }) => t.id === entry.id)
    );

    relatedEntriesByLinks.push(...relatedEntriesByTopic);
  }

  const uniqueRelatedEntries = Array.from(new Set(relatedEntriesByLinks.map((entry) => entry.id)))
    .map((id) => relatedEntriesByLinks.find((entry) => entry.id === id))
    .filter((entry): entry is ZendoCollectionEntry => entry !== undefined);

  return uniqueRelatedEntries.sort(config.sortEntriesFn);
}

export function getCollectionConfig(entryTypeId: ZendoCollectionId): ZendoCollectionConfig {
  const entryTypeConfig = config.sources
    .flatMap((source) => source.entryTypes)
    .find((entryType) => entryType.id === entryTypeId);

  if (!entryTypeConfig) {
    throw new Error(`Entry type configuration not found for entry type ${entryTypeId}`);
  }

  return entryTypeConfig;
}
