import type { CollectionEntry } from "astro:content";
import { createGarden } from "zendo/astro";
import type { EntryIndexRecord } from "zendo";

import config, { collectionIds } from "../zendo.config";
import index from "./data/index.json";

/** The collection ids this site manages, as a strict union. */
export type ZendoCollectionId = (typeof collectionIds)[number];
export type ZendoCollectionEntry<T extends ZendoCollectionId = ZendoCollectionId> = CollectionEntry<T>;
export type { EntryLink } from "zendo";

export const garden = createGarden(config, index as EntryIndexRecord[], collectionIds);

export const {
  getEntries,
  getEntry,
  getRelatedEntries,
  getEntryIndexRecord,
  sortEntries,
  deduplicateEntries,
  getCollectionConfig,
} = garden;

export const buildUrl = config.buildUrl;
