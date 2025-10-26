import fs from "fs/promises";
import * as fse from "fs-extra";
import path from "path";
import { glob } from "glob";

import { type TransformerResult } from "src/lib/garden/transformers";
import type { EntryType } from "src/lib/garden/config";

import config from "garden.config";

async function cleanDirectory(dir: string): Promise<void> {
  try {
    await fse.remove(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function fetchContent(): Promise<string> {
  // Use a persistent hidden directory in the project root
  const cacheDir = path.join(process.cwd(), ".garden-source");
  await fse.mkdirp(cacheDir);

  await config.source(cacheDir);

  return cacheDir;
}

async function transformContent(contentType: EntryType, tmpPath: string): Promise<void> {
  const basePath = path.join(tmpPath, contentType.basePath || "");
  const files = await glob(contentType.pattern, { cwd: basePath });

  if (files.length === 0) {
    console.warn(`No files found for ${contentType.id} (${contentType.pattern})`);
    return;
  }

  for (const file of files) {
    const sourcePath = path.join(basePath, file);

    // Non-markdown files are copied directly without transformation.
    const fileExtension = path.extname(sourcePath).toLowerCase();
    if (fileExtension !== ".md" && fileExtension !== ".mdx") {
      const destinationPath = path.join(config.contentDir, contentType.destinationPath, file);

      await fse.mkdirp(path.dirname(destinationPath));
      await fse.copy(sourcePath, destinationPath);

      continue;
    }

    const fileContent = await fs.readFile(sourcePath, "utf8");

    const result = await contentType.transformers.reduce<Promise<TransformerResult>>(
      async (acc, transformer) => {
        const currentResult = await acc;
        return await transformer(currentResult.path, currentResult.content, contentType);
      },
      Promise.resolve({
        path: file,
        content: fileContent,
      })
    );

    const destinationPath = path.join(config.contentDir, contentType.destinationPath, result.path);

    await fse.mkdirp(path.dirname(destinationPath));
    await fs.writeFile(destinationPath, result.content);
  }
}

async function processContent(): Promise<void> {
  console.log("Cleaning content directory...");
  await cleanDirectory(config.contentDir);

  console.log("Fetching content from source...");
  const tmpPath = await fetchContent();

  for (const contentType of config.entryTypes) {
    console.log(`Processing content type ${contentType.id}...`);
    await transformContent(contentType, tmpPath);
  }

  // Don't delete the cached source directory anymore
  console.log("Content fetching complete!");
}

async function main(): Promise<void> {
  await processContent();
}

main();
