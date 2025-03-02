import { visit } from "unist-util-visit";
import linkMaps from "../../data/links.json";

export function buildContentEntryUrl({ contentType, slug }) {
  switch (contentType) {
    case "essays":
      return `/essays/${slug}`;
    case "notes":
      return `/notes/${slug}`;
    case "nows":
      return `/now/${slug}`;
    case "books":
      return `/books/${slug}`;
    case "articles":
      return `/articles/${slug}`
    default:
      return null;
  }
}

export function remarkWikiLink() {
  return async (tree) => {
    const promises = [];
    
    visit(tree, "text", (node, index, parent) => {
      const matches = Array.from(
        node.value.matchAll(/\[\[(.*?)(?:\|(.*?))?\]\]/g)
      );

      if (!matches.length) return;

      // Create a promise for processing this node
      const processNode = async () => {
        const children = [];
        let lastIndex = 0;

        // Process matches sequentially
        for (const match of matches) {
          const [fullMatch, linkDestination, displayText] = match;
          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          // Add text before the match
          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            });
          }

          // Find the matching post in linkMaps using the linkDestination
          const matchedPost = linkMaps.find((post) => 
            post.ids.some(
              (id) => id.toLowerCase() === linkDestination.toLowerCase()
            )
          );

          let newChild;

          if (matchedPost) {
            const url = await buildContentEntryUrl(matchedPost);

            if (url) {
              newChild = {
                type: "mdxJsxFlowElement",
                name: "Link",
                attributes: [
                  {
                    type: "mdxJsxAttribute",
                    name: "href",
                    value: url,
                  },
                ],
                children: [
                  {
                    type: "text",
                    value: displayText
                      ? displayText.trim()
                      : linkDestination.trim(),
                  },
                ],
              };
            }
          }

          if (!newChild) {
            // If no match found, preserve the original wiki syntax
            newChild = {
              type: "text",
              value: fullMatch,
            };
          }

          children.push(newChild);

          lastIndex = endIndex;
        }

        // Add any remaining text
        if (lastIndex < node.value.length) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex),
          });
        }

        // Replace the original node with our new children
        parent.children.splice(index, 1, ...children);
      };

      promises.push(processNode());
    });

    // Wait for all node processing to complete
    await Promise.all(promises);
    
    return tree;
  };
}
