import type { ZendoCollectionEntry } from "src/garden";
import { getFirstParagraph, renderToString } from "src/lib/rendering";

const MAX_LENGTH = 160;

/** A meta description for an entry: its first paragraph, cut at a word boundary to ~160 characters. */
export async function getEntryDescription(entry: ZendoCollectionEntry): Promise<string | undefined> {
  const paragraph = getFirstParagraph(await renderToString(entry))
    .replace(/\s+/g, " ")
    .trim();
  if (!paragraph) return undefined;
  if (paragraph.length <= MAX_LENGTH) return paragraph;

  const cut = paragraph.slice(0, MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—–-]+$/, "")}…`;
}
