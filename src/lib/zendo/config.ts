import type { Transformer } from "src/lib/zendo/transformers";
import type { Source } from "src/lib/zendo/sources";
import type { GardenEntry } from "./entries";
import type { GardenEntryTypeId } from "./entries";

export interface SearchResult {
  id: string;
  name: string;
  type: GardenEntryTypeId;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
}

export type ContentFilterFn = (entries: GardenEntry[], value: unknown) => Promise<GardenEntry[]>;
export type CollectionFilterFn = (entryTypes: EntryType[], value: unknown) => Promise<EntryType[]>;

export interface FilterConfig {
  id: string;
  ui?: {
    label: string;
    getItems: () => Promise<Array<{ id: string; label: string }>>;
  };
  contentFilterFn?: ContentFilterFn;
  collectionFilterFn?: CollectionFilterFn;
}

export interface EntryType {
  id: string;
  basePath?: string;
  pattern: string;
  destinationPath: string;
  transformers: Transformer[];
  search?: {
    label: string;
    buildSearchResultFn: (entry: GardenEntry) => SearchResult;
    buildUrlFn: (slug: string) => string;
  };
}

export interface SourceConfig {
  id: string;
  source: Source;
  entryTypes: EntryType[];
}

export interface Configuration {
  contentDir: string;
  sources: SourceConfig[];
  filters?: FilterConfig[];
}
