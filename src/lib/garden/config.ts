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

export interface Configuration {
  source: Source;
  contentDir: string;
  entryTypes: EntryType[];
}
