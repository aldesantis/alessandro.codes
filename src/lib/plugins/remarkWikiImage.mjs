import { visit } from "unist-util-visit";

// Updated regex to handle:
// 1. Path-based references (e.g. ![[folder/image.png]])
// 2. Aliases (e.g. ![[folder/image.png|alt text]])
const WIKILINK_IMAGE_REGEX = /!\[\[([^|\]]+)(?:\|([^|\]]+))?\]\]/g;
const MARKDOWN_IMAGE_REGEX = /!\[([^|\]]+)(?:\|([^|\]]+))?\]\(([^)]+)\)/g;

function isRemoteUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function resolveImagePath(imagePath, altText, assetsPath) {
  // If it's a remote URL, return as is
  if (isRemoteUrl(imagePath)) {
    return {
      path: imagePath,
      alt: altText || imagePath.split('/').pop()
    };
  }

  // If the path contains a folder separator, use it as is
  if (imagePath.includes('/')) {
    return {
      path: `${assetsPath}/${imagePath}`,
      alt: altText || imagePath.split('/').pop()
    };
  }
  
  // For simple filenames, just use the filename
  return {
    path: `${assetsPath}/${imagePath}`,
    alt: altText || imagePath
  };
}

export function remarkWikiImage(options) {
  const { assetsPath } = options;
  
  return async (tree) => {
    const promises = [];
    
    visit(tree, "text", (node, index, parent) => {
      const wikilinkMatches = [...node.value.matchAll(WIKILINK_IMAGE_REGEX)];
      const markdownMatches = [...node.value.matchAll(MARKDOWN_IMAGE_REGEX)];
      
      if (!wikilinkMatches.length && !markdownMatches.length) return;

      const processNode = async () => {
        const children = [];
        let lastIndex = 0;

        // Process wikilink-style images
        for (const match of wikilinkMatches) {
          const [fullMatch, imagePath, altText] = match;
          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            });
          }

          const { path: imageUrl, alt } = resolveImagePath(imagePath, altText, assetsPath);

          // Create proper markdown image node
          children.push({
            type: "image",
            url: imageUrl,
            alt: alt || "",
            title: null
          });

          lastIndex = endIndex;
        }

        // Process markdown-style images
        for (const match of markdownMatches) {
          const [fullMatch, alt, url] = match;
          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            });
          }

          const { path: imageUrl, alt: resolvedAlt } = resolveImagePath(url, alt, assetsPath);

          // Create proper markdown image node
          children.push({
            type: "image",
            url: imageUrl,
            alt: resolvedAlt || "",
            title: null
          });

          lastIndex = endIndex;
        }

        if (lastIndex < node.value.length) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex),
          });
        }

        parent.children.splice(index, 1, ...children);
      };

      promises.push(processNode());
    });

    await Promise.all(promises);

    return tree;
  };
} 
