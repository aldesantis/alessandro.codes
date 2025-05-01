import addBasenameToAliases from "src/garden/transformers/addBasenameToAliases";
import normalizeFilename from "src/garden/transformers/normalizeFilename";
import escapeMdx from "src/garden/transformers/escapeMdx";
import removeFirstH1 from "src/garden/transformers/removeFirstH1";
import removeSection from "src/garden/transformers/removeSection";
import renameMdToMdx from "src/garden/transformers/renameMdToMdx";
import addContentTypeToMetadata from "src/garden/transformers/addContentTypeToMetadata";
import type { DigitalGardenContentType } from "./config";

export type TransformerResult = {
  path: string;
  content: string;
};

export type Transformer = (
  originalPath: string,
  originalContent: string,
  contentType: DigitalGardenContentType
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
