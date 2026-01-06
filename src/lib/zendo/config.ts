import type { Transformer } from "src/lib/zendo/transformers";
import type { Source } from "src/lib/zendo/sources";
import type { ZendoCollectionEntry } from "./content";
import type { ZendoCollectionId } from "./content";

export interface SearchResult {
  id: string;
  name: string;
  type: ZendoCollectionId;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
}

export type EntryFilterFn = (entries: ZendoCollectionEntry[], value: unknown) => Promise<ZendoCollectionEntry[]>;
export type CollectionFilterFn = (
  collections: ZendoCollectionConfig[],
  value: unknown
) => Promise<ZendoCollectionConfig[]>;

export interface FilterConfig {
  id: string;
  ui?: {
    label: string;
    getItems: () => Promise<Array<{ id: string; label: string }>>;
  };
  entryFilterFn?: EntryFilterFn;
  collectionFilterFn?: CollectionFilterFn;
}

export interface ZendoCollectionConfig {
  id: string;
  basePath?: string;
  pattern: string;
  destinationPath: string;
  transformers: Transformer[];
  search?: {
    label: string;
    buildSearchResultFn: (entry: ZendoCollectionEntry) => SearchResult;
    buildUrlFn: (slug: string) => string;
  };
}

export interface SourceConfig {
  id: string;
  source: Source;
  entryTypes: ZendoCollectionConfig[];
}

export interface Configuration {
  contentDir: string;
  sources: SourceConfig[];
  filters?: FilterConfig[];
}
