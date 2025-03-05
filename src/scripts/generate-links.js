import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_PATH = path.join(__dirname, "../content");
const CONTENT_TYPES = [
  "essays",
  "notes",
  "nows",
  "books",
  "articles"
];

// Function to extract text between double brackets, now handling labeled links
const bracketsExtractor = (content) => {
  if (!content) return null;
  const matches = content.match(/\[\[(.*?)\]\]/g);
  if (!matches) return null;
  return matches.map((match) => {
    const innerContent = match.slice(2, -2);
    // If there's a pipe, take the part before it (the actual link path)
    // Otherwise use the whole content
    const [linkPath] = innerContent.split('|');
    return linkPath.trim();
  });
};

// Get all content files from a directory
const getFilesFromDir = (dir) => {
  try {
    return fs.readdirSync(dir).filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  } catch (e) {
    console.warn(`No directory found for ${dir}`);
    return [];
  }
};

// Get data for backlinks
const getDataForBacklinks = (fileNames, filePath) =>
  fileNames
    .map((fileName) => {
      const file = fs.readFileSync(path.join(filePath, fileName), "utf8");

      const { content, data } = matter(file);

      // Use slug from frontmatter if available, otherwise derive from filename
      const slugFromFrontmatter = data.slug;
      const slug = slugFromFrontmatter || fileName.replace(/\.mdx?$/, "").replace(/\.md?$/, "");

      const { title, aliases, status, description, publish } = data;

      // Skip draft posts
      if (publish === false) {
        return null;
      }

      return {
        content,
        slug,
        title,
        aliases,
        status,
      };
    })
    .filter(Boolean); // Remove null entries (drafts)

const getAllPostData = () => {
  return CONTENT_TYPES.flatMap((contentType) => {
    const fullPath = path.join(CONTENT_PATH, contentType);

    const files = getFilesFromDir(fullPath);
    const data = getDataForBacklinks(files, fullPath);

    return data.map((d) => ({...d, contentType}));
  });
};

// Main execution
(function () {
  // Get content and frontmatter for each post
  const totalPostData = getAllPostData();

  // Create initial objects with identifiers and empty link arrays
  const posts = totalPostData.map(
    ({ title, aliases, slug, status, description, contentType }) => ({
      ids: [...new Set([title, ...(aliases || []), slug])],
      slug,
      status,
      description,
      contentType,
      outboundLinks: [],
      inboundLinks: [],
    })
  );

  // Get all outbound links
  totalPostData.forEach((postData, index) => {
    const { content } = postData;
    const bracketContents = bracketsExtractor(content);

    bracketContents?.forEach((linkPath) => {
      // Find matching post by title or alias
      const match = posts.find((p) => {
        const normalisedLinkPath = linkPath
          .replace(/\n/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return p.ids.some(
          (id) => id.toLowerCase() === normalisedLinkPath.toLowerCase()
        );
      });

      if (match) {
        // Add to outbound links
        posts[index].outboundLinks.push({
          matchedId: linkPath,
          title: match.ids[0],
          slug: match.slug,
          growthStage: match.growthStage,
          description: match.description,
          contentType: match.contentType
        });
      }
    });
  });

  // Get inbound links
  for (const outerPost of posts) {
    const outerPostTitle = outerPost.ids[0];

    for (const innerPost of posts) {
      const innerPostTitle = innerPost.ids[0];

      if (
        innerPost.outboundLinks.some((link) => link.title === outerPostTitle)
      ) {
        outerPost.inboundLinks.push({
          title: innerPostTitle,
          slug: innerPost.slug,
          growthStage: innerPost.growthStage,
          description: innerPost.description,
          contentType: innerPost.contentType
        });
      }
    }
  }

  // Write to links.json
  fs.writeFileSync(
    path.join(__dirname, "../data/links.json"),
    JSON.stringify(posts, null, 2)
  );
  console.log("✨ Generated links.json");
})();
