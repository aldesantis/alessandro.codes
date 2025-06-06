import type { EntryType } from "src/lib/garden/config";

import addBasenameToAliases from "src/lib/garden/transformers/addBasenameToAliases";
import normalizeFilename from "src/lib/garden/transformers/normalizeFilename";
import escapeMdx from "src/lib/garden/transformers/escapeMdx";
import removeFirstH1 from "src/lib/garden/transformers/removeFirstH1";
import removeSection from "src/lib/garden/transformers/removeSection";
import renameMdToMdx from "src/lib/garden/transformers/renameMdToMdx";
import addContentTypeToMetadata from "src/lib/garden/transformers/addContentTypeToMetadata";

export type TransformerResult = {
  path: string;
  content: string;
};

export type Transformer = (
  originalPath: string,
  originalContent: string,
  contentType: EntryType
) => Promise<TransformerResult>;

export {
  addBasenameToAliases,
  normalizeFilename,
  escapeMdx,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  addContentTypeToMetadata,
};
