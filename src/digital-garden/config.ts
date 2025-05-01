import type { Transformer } from "./transformers";

export type DigitalGardenSource = (destination: string) => Promise<void>;

export interface DigitalGardenContentType {
  id: string;
  pattern: string;
  targetPath: string;
  transformers: Transformer[];
}

export interface DigitalGardenConfig {
  source: DigitalGardenSource;
  contentDir: string;
  contentTypes: DigitalGardenContentType[];
}
