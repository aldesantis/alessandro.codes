import type { EntryType } from "src/lib/garden/config";

import addBasenameToAliases from "src/lib/garden/transformers/addBasenameToAliases";
import normalizeFilename from "src/lib/garden/transformers/normalizeFilename";
import escapeMdx from "src/lib/garden/transformers/escapeMdx";
import removeFirstH1 from "src/lib/garden/transformers/removeFirstH1";
import removeSection from "src/lib/garden/transformers/removeSection";
import renameMdToMdx from "src/lib/garden/transformers/renameMdToMdx";
import addContentTypeToMetadata from "src/lib/garden/transformers/addContentTypeToMetadata";
import removeDrafts from "src/lib/garden/transformers/removeDrafts";
import demoteHeadings from "src/lib/garden/transformers/demoteHeadings";
import normalizeMetadata from "src/lib/garden/transformers/normalizeMetadata";
import convertNotionLinksToWikilinks from "src/lib/garden/transformers/convertNotionLinksToWikilinks";

export type TransformerResult = {
  path: string;
  content: string | Buffer;
} | null;

export type Transformer = (
  originalPath: string,
  originalContent: string | Buffer,
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
  removeDrafts,
  demoteHeadings,
  normalizeMetadata,
  convertNotionLinksToWikilinks,
};
