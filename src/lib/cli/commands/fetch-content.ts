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

async function fetchContent(sourceId: string, source: (destination: string) => Promise<void>): Promise<string> {
  const baseCacheDir = path.join(process.cwd(), ".garden-source");
  const cacheDir = path.join(baseCacheDir, sourceId);

  await fse.mkdirp(cacheDir);
  await source(cacheDir);

  return cacheDir;
}

async function transformContent(contentType: EntryType, tmpPath: string, contentDir: string): Promise<void> {
  const basePath = path.join(tmpPath, contentType.basePath || "");
  const files = await glob(contentType.pattern, { cwd: basePath });

  if (files.length === 0) {
    console.warn(`No files found for ${contentType.id} (${contentType.pattern})`);
    return;
  }

  for (const file of files) {
    const sourcePath = path.join(basePath, file);

    // Read file as buffer for binary files, UTF-8 for text files
    const fileExtension = path.extname(sourcePath).toLowerCase();
    const isTextFile = fileExtension === ".md" || fileExtension === ".mdx";
    const fileContent: string | Buffer = isTextFile
      ? await fs.readFile(sourcePath, "utf8")
      : await fs.readFile(sourcePath);

    const result = await contentType.transformers.reduce<Promise<TransformerResult>>(
      async (acc, transformer) => {
        const currentResult = await acc;

        if (currentResult === null) {
          return null;
        }

        return await transformer(currentResult.path, currentResult.content, contentType);
      },
      Promise.resolve({
        path: file,
        content: fileContent,
      })
    );

    if (result === null) {
      continue;
    }

    const destinationPath = path.join(contentDir, contentType.destinationPath, result.path);

    await fse.mkdirp(path.dirname(destinationPath));

    // Write buffer or string content appropriately
    if (Buffer.isBuffer(result.content)) {
      await fs.writeFile(destinationPath, result.content);
    } else {
      await fs.writeFile(destinationPath, result.content, "utf8");
    }
  }
}

export default async function processContent(): Promise<void> {
  console.log(`Cleaning content directory: ${config.contentDir}`);
  await cleanDirectory(config.contentDir);

  for (const sourceConfig of config.sources) {
    console.log(`Fetching content from source: ${sourceConfig.id}...`);
    const cachePath = await fetchContent(sourceConfig.id, sourceConfig.source);

    for (const contentType of sourceConfig.entryTypes) {
      console.log(`Processing content type ${contentType.id}...`);
      await transformContent(contentType, cachePath, config.contentDir);
    }
  }

  // Don't delete the cached source directory anymore
  console.log("Content fetching complete!");
}
