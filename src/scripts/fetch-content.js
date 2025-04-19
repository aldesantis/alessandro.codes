import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import slugify from "slugify";
const REPO_URL = "git@github.com:aldesantis/digital-garden.git";
const CONTENT_DIR = path.join(process.cwd(), "src", "content");
const RETAIN_DIRS = ["essays", "notes", "nows", "books", "articles", "topics"];

async function cleanDirectory(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function cloneRepository() {
  console.log("Cloning repository...");
  execSync(`git clone ${REPO_URL} ${CONTENT_DIR}`, { stdio: "inherit" });
}

function slugifyFileName(fileName) {
  const fileExt = path.extname(fileName);
  const baseName = path.basename(fileName, fileExt);

  return slugify(baseName, { lower: true, strict: true }) + fileExt;
}

async function processReadwiseContent() {
  console.log("Adjusting paths for Readwise content...");
  const types = ["books", "articles", "topics"];

  for (const type of types) {
    console.log(`Adjusting paths for ${type}...`);
    const sourcePath = path.join(CONTENT_DIR, "readwise", type);
    const targetPath = path.join(CONTENT_DIR, type);

    try {
      // Ensure source directory exists
      await fs.access(sourcePath);

      // Create target directory if it doesn't exist
      await fs.mkdir(targetPath, { recursive: true });

      // Move all files from source to target
      const files = await fs.readdir(sourcePath);
      for (const file of files) {
        const sourceFile = path.join(sourcePath, file);
        const fileName = slugifyFileName(file);
        const extension = path.extname(fileName);
        const truncatedName = fileName.length > 100 ? fileName.slice(0, 100 - extension.length) + extension : fileName;
        const targetFile = path.join(targetPath, truncatedName);

        // Read the file content
        const content = await fs.readFile(sourceFile, "utf8");
        const { data, content: markdownContent } = matter(content);

        // Add original filename to aliases
        const baseName = path.basename(file, path.extname(file));
        data.aliases = data.aliases || [];
        if (!data.aliases.includes(baseName)) {
          data.aliases.push(baseName);
        }

        // Escape any MDX components in the content
        const escapedContent = markdownContent.replace(/</g, "\\<");

        // Write updated content to new location
        const newContent = matter.stringify(escapedContent, data);
        await fs.writeFile(targetFile, newContent);
        await fs.unlink(sourceFile);
      }

      // Remove the now-empty directory from readwise
      await cleanDirectory(sourcePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Error moving ${type}:`, error);
        throw error;
      }
    }
  }
}

async function removeUnwantedDirs() {
  console.log("Removing unwanted directories...");
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name.startsWith(".")) {
      await cleanDirectory(path.join(CONTENT_DIR, entry.name));
      continue;
    }

    if (entry.isDirectory() && !RETAIN_DIRS.includes(entry.name)) {
      await cleanDirectory(path.join(CONTENT_DIR, entry.name));
    }
  }
}

async function processMarkdownFiles() {
  console.log("Processing Markdown files...");

  for (const dir of RETAIN_DIRS) {
    const dirPath = path.join(CONTENT_DIR, dir);

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, "utf8");

        // Parse frontmatter and content
        const { data, content: markdownContent } = matter(content);

        // Remove the first H1 heading and the Metadata section
        let processedContent = markdownContent
          .replace(/^#\s+[^\n]+\n+/, "") // Remove first H1 heading and following newlines
          .replace(/##\s+Metadata[\s\S]*?(?=##|$)/, "") // Remove Metadata section and its content
          .trim();

        // Find any H1 heading after frontmatter
        const h1Match = processedContent.match(/^\s*#\s+[^\n]+\n+/);
        if (h1Match) {
          processedContent = processedContent.slice(h1Match[0].length).trim();
        }

        // Remove any extra newlines that might have been created
        processedContent = processedContent.replace(/\n{3,}/g, "\n\n");

        // Reconstruct the file with frontmatter
        const newContent = matter.stringify(processedContent, data);

        // Write to new .mdx file
        const newFilePath = filePath.replace(/\.md$/, ".mdx");
        await fs.writeFile(newFilePath, newContent);

        // Remove original .md file
        await fs.unlink(filePath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Error processing directory ${dir}:`, error);
      }
    }
  }
}

async function processStaticPages() {
  const staticPages = ["about.md", "colophon.md"];

  console.log("Processing static pages...");

  for (const page of staticPages) {
    const filePath = path.join(CONTENT_DIR, page);
    const newFilePath = filePath.replace(/\.md$/, ".mdx");

    try {
      console.log(`Processing ${page}...`);
      await fs.rename(filePath, newFilePath);
      console.log(`${page} processed successfully!`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Error processing ${page}:`, error);
      } else {
        console.log(`${page} not found, skipping.`);
      }
    }
  }
}

async function main() {
  try {
    await cleanDirectory(CONTENT_DIR);
    await cloneRepository();
    await processReadwiseContent();
    await removeUnwantedDirs();
    await processMarkdownFiles();
    await processStaticPages();
    console.log("Repository processing completed successfully!");
  } catch (error) {
    console.error("Error processing repository:", error);
    process.exit(1);
  }
}

main();
