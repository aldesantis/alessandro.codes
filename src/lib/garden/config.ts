import type { Transformer } from "./transformers";

export type DigitalGardenSource = (destination: string) => Promise<void>;

export interface DigitalGardenContentType {
  id: string;
  pattern: string;
  destinationPath: string;
  transformers: Transformer[];
  urlBuilder?: (slug: string) => string;
}

export interface DigitalGardenConfig {
  source: DigitalGardenSource;
  contentDir: string;
  entryTypes: DigitalGardenContentType[];
}
