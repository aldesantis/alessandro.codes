import { Command } from "commander";
import fetchContent from "./commands/fetch-content";
import indexContent from "./commands/index-content";
import updateContent from "./commands/update-content";

const program = new Command();

program.name("zendo").description("Your digital garden toolkit").version("0.1.0");

program.command("fetch-content").description("Fetch content from configured sources").action(fetchContent);
program.command("index-content").description("Index content and generate src/data/index.json").action(indexContent);

program
  .command("update-content")
  .description("Fetch content, index it, build, and commit changes")
  .option("--skip-build", "Skip the build step")
  .option("--skip-git", "Skip git add/commit/push")
  .option("-m, --commit-message <msg>", "Custom commit message", "Update content")
  .option("-v, --verbose", "Enable verbose logging")
  .action(updateContent);

export default program;
