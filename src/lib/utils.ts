export function isInternalUrl(url: string): boolean {
  const base = new URL("https://alessandro.codes");

  try {
    const parsedUrl = new URL(url, base);

    return (
      parsedUrl.hostname === base.hostname &&
      !parsedUrl.pathname.startsWith("/articles")
    );
  } catch (e) {
    return false;
  }
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
