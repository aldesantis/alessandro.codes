export function isInternalUrl(url: string): boolean {
  const base = new URL("https://alessandro.codes");
  return new URL(url, base).hostname === base.hostname;
}
