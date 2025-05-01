import type { Transformer } from "./transformers";

export type DigitalGardenSource = (destination: string) => Promise<void>;

export interface DigitalGardenConfig {
  source: DigitalGardenSource;
  contentDir: string;
  contentTypes: {
    id: string;
    pattern: string;
    transformers: Transformer[];
  }[];
}
