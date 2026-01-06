import { exec } from "child_process";
import { promisify } from "util";
import fetchContent from "./fetch-content";
import indexContent from "./index-content";

const execAsync = promisify(exec);

interface UpdateContentOptions {
  skipBuild?: boolean;
  skipGit?: boolean;
  commitMessage?: string;
  verbose?: boolean;
}

/**
 * Main function to update content: fetch, index, build, and commit
 */
export default async function updateContent(options: UpdateContentOptions = {}): Promise<void> {
  if (options.verbose) {
    console.log("Verbose mode enabled");
  }

  // Step 1: Fetch content
  console.log("Step 1/4: Fetching content...");
  await fetchContent();

  // Step 2: Index content
  console.log("Step 2/4: Indexing content...");
  await indexContent();

  // Step 3: Build (unless skipped)
  if (!options.skipBuild) {
    console.log("Step 3/4: Building...");
    const { stdout, stderr } = await execAsync("npm run build");
    if (options.verbose) {
      console.log(stdout);
      if (stderr) console.error(stderr);
    }
  } else {
    console.log("Step 3/4: Skipping build");
  }

  // Step 4: Git operations (unless skipped)
  if (!options.skipGit) {
    console.log("Step 4/4: Committing and pushing changes...");
    await execAsync("git add src/data/index.json src/content");
    await execAsync(`git commit -m "${options.commitMessage || "Update content"}"`);
    await execAsync("git push");
    console.log("✅ All steps completed!");
  } else {
    console.log("Step 4/4: Skipping git operations");
    console.log("✅ All steps completed!");
  }
}
