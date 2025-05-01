/**
 * Extracts wikilinks from text content
 * @param {string} content - The text content to extract wikilinks from
 * @returns {Array<{linkDestination: string, displayText: string}>} - Array of extracted wikilinks
 */
export function extractWikilinks(content) {
  if (!content) return [];

  const matches = Array.from(content.matchAll(/\[\[(.*?)(?:\|(.*?))?\]\]/g));

  return matches.map((match) => {
    const [, linkDestination, displayText] = match;
    return {
      linkDestination: linkDestination.trim(),
      displayText: (displayText || linkDestination).trim(),
    };
  });
}

/**
 * Extracts raw link destinations from wikilinks in text content
 * @param {string} content - The text content to extract wikilinks from
 * @returns {string[]} - Array of extracted link destinations
 */
export function extractWikilinkDestinations(content) {
  if (!content) return [];

  const matches = content.match(/\[\[(.*?)\]\]/g);
  if (!matches) return [];

  return matches.map((match) => {
    const innerContent = match.slice(2, -2);
    const [linkPath] = innerContent.split("|");
    return linkPath?.trim() ?? "";
  });
}
