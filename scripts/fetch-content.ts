import fs from "fs/promises";
import * as fse from "fs-extra";
import path from "path";
import os from "os";
import { glob } from "glob";

import { type TransformerResult } from "src/digital-garden/transformers";
import config from "../scripts/config";
import type { DigitalGardenContentType } from "src/digital-garden/config";

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

async function transformContent(contentType: DigitalGardenContentType, tmpPath: string): Promise<void> {
  const files = await glob(contentType.pattern, { cwd: tmpPath });

  if (files.length === 0) {
    console.warn(`No files found for ${contentType.id} (${contentType.pattern})`);
    return;
  }

  for (const file of files) {
    const sourcePath = path.join(tmpPath, file);
    const fileContent = await fs.readFile(sourcePath, "utf8");

    const result = await contentType.transformers.reduce<Promise<TransformerResult>>(
      async (acc, transformer) => {
        const currentResult = await acc;

        if (!currentResult) {
          return null;
        }

        const result = await transformer(currentResult.path, currentResult.content);

        return result || currentResult;
      },
      Promise.resolve({
        path: path.join(config.contentDir, path.relative(tmpPath, sourcePath)),
        content: fileContent,
      })
    );

    if (result) {
      await fse.mkdirp(path.dirname(result.path));
      await fs.writeFile(result.path, result.content);
    }
  }
}

async function processContent(): Promise<void> {
  console.log("Cleaning content directory...");
  await cleanDirectory(config.contentDir);

  console.log("Fetching content from source...");
  const tmpPath = await fetchContent();

  for (const contentType of config.contentTypes) {
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
