import matter from "gray-matter";

import type { Transformer } from "src/lib/garden/transformers";
import type { DigitalGardenContentType } from "../config";

const addContentTypeToMetadata = (): Transformer => {
  return async (originalPath: string, originalContent: string, contentType: DigitalGardenContentType) => {
    const { data, content } = matter(originalContent);

    // Add the content type ID to the metadata
    data.contentType = contentType.id;

    const newContent = matter.stringify(content, data);

    return {
      path: originalPath,
      content: newContent,
    };
  };
};

export default addContentTypeToMetadata;
