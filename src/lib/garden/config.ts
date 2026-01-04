import type { Transformer } from "src/lib/garden/transformers";
import type { Source } from "src/lib/garden/sources";
import type { GardenEntry } from "./entries";
import type { GardenEntryTypeId } from "./entries";

export interface SearchResult {
  id: string;
  name: string;
  type: GardenEntryTypeId;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
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
}
