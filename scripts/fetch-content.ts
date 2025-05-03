import fs from "fs/promises";
import * as fse from "fs-extra";
import path from "path";
import os from "os";
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
  const tmpPath = path.join(os.tmpdir(), `digital-garden-source-${Math.random().toString(36).substring(2, 15)}`);
  await fse.mkdirp(tmpPath);

  await config.source(tmpPath);

  return tmpPath;
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

  console.log("Cleaning temporary directory...");
  await cleanDirectory(tmpPath);
}

async function main(): Promise<void> {
  await processContent();
}

main();
