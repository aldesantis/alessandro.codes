import addBasenameToAliases from "src/digital-garden/transformers/addBasenameToAliases";
import normalizeFilename from "src/digital-garden/transformers/normalizeFilename";
import escapeMdx from "src/digital-garden/transformers/escapeMdx";
import removeFirstH1 from "src/digital-garden/transformers/removeFirstH1";
import removeSection from "src/digital-garden/transformers/removeSection";
import renameMdToMdx from "src/digital-garden/transformers/renameMdToMdx";
import moveToDirectory from "src/digital-garden/transformers/moveToDirectory";

export type TransformerResult = {
  path: string;
  content: string;
} | null;

export type Transformer = (originalPath: string, originalContent: string) => Promise<TransformerResult>;

export {
  addBasenameToAliases,
  normalizeFilename,
  escapeMdx,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  moveToDirectory,
};
