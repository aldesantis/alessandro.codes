import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

import config from "garden.config";
import { extractWikilinks } from "src/lib/utils/wikilink.mjs";
import type { EntryLink, EntryIndexRecord } from "src/lib/garden/entries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FileData {
  content: string;
  slug: string;
  title: string;
  aliases?: string[];
  type: string;
}

/**
 * Gets all markdown files from a directory
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir, { recursive: true });
    return files.filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  } catch (error) {
    console.warn(`No directory found for ${dir}: ${error}`);
    return [];
  }
}

/**
 * Processes a single markdown file to extract its data
 */
async function parseMarkdownFile(filePath: string, fileName: string): Promise<FileData | null> {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(fileContent);

    const slug = data.slug || path.parse(path.basename(fileName)).name;
    const { title, aliases, contentType } = data;

    if (!contentType) {
      console.warn(`Missing contentType in ${filePath}`);
      return null;
    }

    return {
      content,
      slug,
      title,
      aliases,
      type: contentType,
    };
  } catch (error) {
    console.warn(`Error processing file ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Gets all garden entry data
 */
async function parseAllMarkdownFiles(): Promise<FileData[]> {
  const files = await getMarkdownFiles(config.contentDir);

  const entries = await Promise.all(files.map((file) => parseMarkdownFile(path.join(config.contentDir, file), file)));

  return entries.filter((entry): entry is FileData => entry !== null);
}

/**
 * Creates a garden entry from entry data
 */
function buildGardenIndexEntry(entryData: FileData): EntryIndexRecord {
  return {
    ids: [...new Set([entryData.title, ...(entryData.aliases || []), entryData.slug])],
    slug: entryData.slug,
    type: entryData.type,
    outboundLinks: [],
    inboundLinks: [],
  };
}

/**
 * Processes outbound links for a garden entry
 */
function extractOutboundLinks(
  fileData: FileData,
  GardenIndexEntry: EntryIndexRecord,
  allEntries: EntryIndexRecord[]
): EntryIndexRecord {
  const linkPaths = extractWikilinks(fileData.content).map(({ linkDestination }) => linkDestination);
  const outboundLinks: EntryLink[] = [];

  for (const linkPath of linkPaths) {
    if (!linkPath) {
      continue;
    }

    const normalizedPath = linkPath.replace(/\n/g, "").replace(/\s+/g, " ").trim();
    const match = allEntries.find((p) => p.ids.some((id) => id.toLowerCase() === normalizedPath.toLowerCase()));

    if (!match) {
      continue;
    }

    // Skip self-references and duplicate links
    if (
      match.slug === GardenIndexEntry.slug ||
      outboundLinks.some((link) => link.slug === match.slug && link.type === match.type)
    ) {
      continue;
    }

    outboundLinks.push({
      slug: match.slug,
      type: match.type,
    });
  }

  return {
    ...GardenIndexEntry,
    outboundLinks,
  };
}

/**
 * Processes inbound links for a garden entry
 */
function extractInboundLinks(entry: EntryIndexRecord, allEntries: EntryIndexRecord[]): EntryIndexRecord {
  const inboundLinks: EntryLink[] = [];

  for (const otherEntry of allEntries) {
    if (!otherEntry.outboundLinks.some((link) => link.slug === entry.slug && link.type === entry.type)) {
      continue;
    }

    // Skip self-references and duplicate links
    if (
      otherEntry.slug === entry.slug ||
      inboundLinks.some((link) => link.slug === otherEntry.slug && link.type === otherEntry.type)
    ) {
      continue;
    }

    inboundLinks.push({
      slug: otherEntry.slug,
      type: otherEntry.type,
    });
  }

  return {
    ...entry,
    inboundLinks,
  };
}

/**
 * Writes the garden index to a JSON file
 */
async function writeGardenIndex(entries: EntryIndexRecord[]): Promise<void> {
  const outputPath = path.join(__dirname, "../src/data/index.json");
  await fs.writeFile(outputPath, JSON.stringify(entries, null, 2));
  console.log("✨ Generated garden index in index.json");
}

/**
 * Main function to generate the garden index
 */
async function generateIndex(): Promise<void> {
  console.log("Starting index generation...");

  const filesData = await parseAllMarkdownFiles();
  console.log(`Found ${filesData.length} files to process`);

  const indexEntries = filesData.map(buildGardenIndexEntry);

  console.log("Extracting outbound links...");
  const indexEntriesWithOutboundLinks = indexEntries.map((GardenIndexEntry) => {
    const fileData = filesData.find((f) => f.slug === GardenIndexEntry.slug);
    return extractOutboundLinks(fileData!, GardenIndexEntry, indexEntries);
  });

  console.log("Extracting inbound links...");
  const indexEntriesWithAllLinks = indexEntriesWithOutboundLinks.map((entry) =>
    extractInboundLinks(entry, indexEntriesWithOutboundLinks)
  );

  await writeGardenIndex(indexEntriesWithAllLinks);
  console.log("✅ Index generation complete!");
}

generateIndex();
