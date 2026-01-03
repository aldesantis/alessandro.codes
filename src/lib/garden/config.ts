import type { Transformer } from "src/lib/garden/transformers";
import type { Source } from "src/lib/garden/sources";
import type { GardenEntry } from "./entries";

export interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
}

export interface EntryType {
  id: string;
  basePath?: string;
  pattern: string;
  destinationPath: string;
  transformers: Transformer[];
  urlBuilder?: (slug: string) => string;
  search?: {
    label: string;
    filter: (entry: GardenEntry, query: string) => boolean;
    toCommandPaletteItem: (entry: GardenEntry) => ContentItem;
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
