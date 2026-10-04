// Builds the `data-<controller>-target` attribute, so shared components can
// expose elements to whichever controller owns the figure.
export function targetAttr(controller: string, name: string): Record<string, string> {
  return { [`data-${controller}-target`]: name };
}
