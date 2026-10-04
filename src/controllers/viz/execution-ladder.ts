import { Controller } from "@hotwired/stimulus";

interface Rung {
  label: string;
  translation: number;
}

// How much capability it takes to fully absorb one rung's translation, once
// AI starts on it.
const RAMP = 0.3;

// AI absorbs each rung's translation, starting with the rungs that are mostly
// translation. Meaningmaking is never absorbed.
export default class ExecutionLadderController extends Controller {
  static override values = { rungs: Array };
  static override targets = ["capability", "ai", "translation", "bar", "share", "summary"];

  declare readonly rungsValue: Rung[];
  declare readonly capabilityTarget: HTMLInputElement;
  declare readonly aiTargets: HTMLElement[];
  declare readonly translationTargets: HTMLElement[];
  declare readonly barTargets: HTMLElement[];
  declare readonly shareTargets: HTMLElement[];
  declare readonly summaryTarget: HTMLElement;

  override connect() {
    this.update();
  }

  update() {
    const capability = Number(this.capabilityTarget.value) / 100;
    let absorbedTotal = 0;

    this.rungsValue.forEach((rung, index) => {
      // Rungs with less open intent start getting absorbed earlier.
      const start = (1 - rung.translation) * (1 - RAMP);
      const progress = Math.max(0, Math.min(1, (capability - start) / RAMP));
      const absorbed = rung.translation * progress;
      absorbedTotal += absorbed;

      this.aiTargets[index]!.style.width = `${absorbed * 100}%`;
      this.translationTargets[index]!.style.width = `${(rung.translation - absorbed) * 100}%`;
      this.aiTargets[index]!.setAttribute("data-tip", `${Math.round(absorbed * 100)}% absorbed by AI`);
      this.aiTargets[index]!.setAttribute("data-tip-label", rung.label);
      const breakdown = [
        `${Math.round(absorbed * 100)}% absorbed by AI`,
        `${Math.round((rung.translation - absorbed) * 100)}% translation by people`,
        `${Math.round((1 - rung.translation) * 100)}% meaningmaking`,
      ].join(", ");
      this.barTargets[index]!.setAttribute("data-tip", breakdown);
      this.barTargets[index]!.setAttribute("data-tip-label", rung.label);
      this.barTargets[index]!.setAttribute("aria-label", `${rung.label}: ${breakdown}`);
      this.shareTargets[index]!.textContent = absorbed > 0.005 ? `${Math.round(absorbed * 100)}% AI` : "";
    });

    const share = Math.round((absorbedTotal / this.rungsValue.length) * 100);
    this.summaryTarget.textContent = `AI does ${share}% of the ladder’s work`;
  }
}
