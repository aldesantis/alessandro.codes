// Taken almost verbatim from:
// https://github.com/MaggieAppleton/maggieappleton.com-V3/blob/main/src/scripts/generate-links.js

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
];

// Function to extract text between double brackets
const bracketsExtractor = (content) => {
  if (!content) return null;
  const matches = content.match(/\[\[(.*?)\]\]/g);
  if (!matches) return null;
  return matches.map((match) => match.slice(2, -2));
};

// Get all content files from a directory
const getFilesFromDir = (dir) => {
  try {
    return fs.readdirSync(dir).filter((file) => file.endsWith(".md"));
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

      const slug = fileName.replace(/\.mdx?$/, "").replace(/\.md?$/, "");

      const { title, aliases, growthStage, description, draft } = data;

      // Skip draft posts
      if (draft === true) {
        return null;
      }

      return {
        content,
        slug,
        title,
        aliases,
      };
    })
    .filter(Boolean); // Remove null entries (drafts)

const getAllPostData = () => {
  return CONTENT_TYPES.flatMap((contentType) => {
    const fullPath = path.join(CONTENT_PATH, contentType);

    const files = getFilesFromDir(fullPath);
    const data = getDataForBacklinks(files, fullPath);

    return data;
  });
};

// Main execution
(function () {
  // Get content and frontmatter for each post
  const totalPostData = getAllPostData();

  // Create initial objects with identifiers and empty link arrays
  const posts = totalPostData.map(
    ({ title, aliases, slug, growthStage, description }) => ({
      ids: [title, ...(aliases ? aliases : [])],
      slug,
      growthStage,
      description,
      outboundLinks: [],
      inboundLinks: [],
    })
  );

  // Get all outbound links
  totalPostData.forEach((postData, index) => {
    const { content } = postData;
    const bracketContents = bracketsExtractor(content);

    bracketContents?.forEach((alias) => {
      // Find matching post by title or alias
      const match = posts.find((p) => {
        const normalisedAlias = alias
          .replace(/\n/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return p.ids.some(
          (id) => id.toLowerCase() === normalisedAlias.toLowerCase()
        );
      });

      if (match) {
        // Add to outbound links
        posts[index].outboundLinks.push({
          matchedId: alias,
          title: match.ids[0],
          slug: match.slug,
          growthStage: match.growthStage,
          description: match.description,
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
