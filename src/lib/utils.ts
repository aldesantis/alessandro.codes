export function isInternalUrl(url: string): boolean {
  const base = new URL("https://alessandro.codes");

  try {
    return new URL(url, base).hostname === base.hostname;
  } catch (e) {
    return false;
  }
}
