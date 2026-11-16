/** Reading statuses that mean the book was read to the end. */
const FINISHED_STATUSES: readonly string[] = ["read", "distilled"];

export function isFinished(status: string): boolean {
  return FINISHED_STATUSES.includes(status);
}
