import type { Transformer } from "src/lib/garden/transformers";
import type { Source } from "src/lib/garden/sources";

export interface EntryType {
  id: string;
  basePath?: string;
  pattern: string;
  destinationPath: string;
  transformers: Transformer[];
  urlBuilder?: (slug: string) => string;
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
