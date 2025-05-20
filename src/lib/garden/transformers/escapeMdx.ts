import type { Transformer } from "../transformers";
import matter from "gray-matter";

const escapeMdx = (): Transformer => {
  return async (originalPath: string, originalContent: string) => {
    const { data, content: markdownContent } = matter(originalContent);

    // Escape any MDX components and curly braces in the content
    const escapedContent = markdownContent.replace(/</g, "\\<").replace(/{/g, "\\{").replace(/}/g, "\\}");

    // Create new content
    const newContent = matter.stringify(escapedContent, data);

    return {
      path: originalPath,
      content: newContent,
    };
  };
};

export default escapeMdx;
