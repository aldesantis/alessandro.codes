import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_PATH = path.join(__dirname, "../src/content");
const CONTENT_TYPES = ["essays", "notes", "nows", "books", "articles", "topics", "recipes"] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

interface GardenEntryData {
  content: string;
  slug: string;
  title: string;
  aliases?: string[];
  type: ContentType;
}

interface Link {
  matchedId?: string;
  title: string;
  slug: string;
  type: ContentType;
}

interface GardenEntry {
  ids: string[];
  slug: string;
  type: ContentType;
  outboundLinks: Link[];
  inboundLinks: Link[];
}

// Function to extract text between double brackets, now handling labeled links
const bracketsExtractor = (content: string): string[] | null => {
  if (!content) return null;
  const matches = content.match(/\[\[(.*?)\]\]/g);
  if (!matches) return null;
  return matches.map((match) => {
    const innerContent = match.slice(2, -2);
    // If there's a pipe, take the part before it (the actual link path)
    // Otherwise use the whole content
    const [linkPath] = innerContent.split("|");
    return linkPath?.trim() ?? "";
  });
};

// Get all content files from a directory
const getFilesFromDir = (dir: string): string[] => {
  try {
    return fs.readdirSync(dir).filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  } catch {
    console.warn(`No directory found for ${dir}`);
    return [];
  }
};

// Get data for backlinks
const getDataForBacklinks = (fileNames: string[], filePath: string): GardenEntryData[] =>
  fileNames
    .map((fileName) => {
      const file = fs.readFileSync(path.join(filePath, fileName), "utf8");

      const { content, data } = matter(file);

      // Use slug from frontmatter if available, otherwise derive from filename
      const slugFromFrontmatter = data.slug;
      const slug = slugFromFrontmatter || fileName.replace(/\.mdx?$/, "").replace(/\.md?$/, "");

      const { title, aliases } = data;

      return {
        content,
        slug,
        title,
        aliases,
      };
    })
    .filter(Boolean) as GardenEntryData[]; // Remove null entries (drafts)

const getAllGardenEntryData = (): GardenEntryData[] => {
  return CONTENT_TYPES.flatMap((type) => {
    const fullPath = path.join(CONTENT_PATH, type);

    const files = getFilesFromDir(fullPath);
    const data = getDataForBacklinks(files, fullPath);

    return data.map((d) => ({ ...d, type }));
  });
};

// Main execution
(function () {
  // Get content and frontmatter for each garden entry
  const totalGardenEntryData = getAllGardenEntryData();

  // Create initial objects with identifiers and empty link arrays
  const gardenEntries: GardenEntry[] = totalGardenEntryData.map(({ title, aliases, slug, type }) => ({
    ids: [...new Set([title, ...(aliases || []), slug])],
    slug,
    type,
    outboundLinks: [],
    inboundLinks: [],
  }));

  // Get all outbound links
  totalGardenEntryData.forEach((entryData, index) => {
    const { content } = entryData;
    const bracketContents = bracketsExtractor(content);

    bracketContents?.forEach((linkPath) => {
      if (!linkPath) return;

      // Find matching entry by title or alias
      const match = gardenEntries.find((p) => {
        const normalisedLinkPath = linkPath.replace(/\n/g, "").replace(/\s+/g, " ").trim();
        return p.ids.some((id) => id.toLowerCase() === normalisedLinkPath.toLowerCase());
      });

      if (match && match.ids[0] && gardenEntries[index]) {
        // Add to outbound links
        gardenEntries[index].outboundLinks.push({
          matchedId: linkPath,
          title: match.ids[0],
          slug: match.slug,
          type: match.type,
        });
      }
    });
  });

  // Get inbound links
  for (const outerEntry of gardenEntries) {
    const outerEntryTitle = outerEntry.ids[0] ?? "";

    for (const innerEntry of gardenEntries) {
      const innerEntryTitle = innerEntry.ids[0] ?? "";

      if (innerEntry.outboundLinks.some((link) => link.title === outerEntryTitle)) {
        outerEntry.inboundLinks.push({
          title: innerEntryTitle,
          slug: innerEntry.slug,
          type: innerEntry.type,
        });
      }
    }
  }

  // Write to index.json
  fs.writeFileSync(path.join(__dirname, "../src/data/index.json"), JSON.stringify(gardenEntries, null, 2));
  console.log("✨ Generated garden index in index.json");
})();
