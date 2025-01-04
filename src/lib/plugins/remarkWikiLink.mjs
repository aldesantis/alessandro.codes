import { visit } from "unist-util-visit";
import linkMaps from "../../data/links.json";

export function remarkWikiLink() {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      const matches = Array.from(node.value.matchAll(/\[\[(.*?)\]\]/g));
      if (!matches.length) return;

      const children = [];
      let lastIndex = 0;

      matches.forEach((match) => {
        const [fullMatch, linkText] = match;
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        // Add text before the match
        if (startIndex > lastIndex) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex, startIndex),
          });
        }

        // Find the matching post in linkMaps
        const matchedPost = linkMaps.find((post) =>
          post.ids.some((id) => id.toLowerCase() === linkText.toLowerCase())
        );

        let newChild;

        if (matchedPost) {
          if (matchedPost.contentType === "essays") {
            // Create the InternalTooltipLink component
            newChild = {
              type: "mdxJsxFlowElement",
              name: "Link",
              attributes: [
                {
                  type: "mdxJsxAttribute",
                  name: "href",
                  value: `/essays/${matchedPost.slug}`,
                },
              ],
              children: [{ type: "text", value: linkText }],
            };
          }
        }

        if (!newChild){
          // If no match found, just add the text as is
          newChild = {
            type: "text",
            value: fullMatch,
          };
        }

        children.push(newChild);

        lastIndex = endIndex;
      });

      // Add any remaining text
      if (lastIndex < node.value.length) {
        children.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      // Replace the original node with our new children
      parent.children.splice(index, 1, ...children);
    });
  };
}
