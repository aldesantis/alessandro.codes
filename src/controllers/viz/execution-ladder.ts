import { Controller } from "@hotwired/stimulus";
import { syncSlider } from "./helpers";

interface Rung {
  label: string;
  translation: number;
}

// How much capability it takes to fully absorb one rung's translation, once
// AI starts on it.
const RAMP = 0.3;

// Rounds shares that add up to 1 into whole percentages that add up to 100
// (largest remainder), so a breakdown never reads 101%.
function percentages(shares: number[]): number[] {
  const raw = shares.map((share) => share * 100);
  const rounded = raw.map(Math.floor);
  let missing = 100 - rounded.reduce((sum, value) => sum + value, 0);
  raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ index }) => {
      if (missing-- > 0) rounded[index]! += 1;
    });
  return rounded;
}

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
      const [ai, people, meaning] = percentages([absorbed, rung.translation - absorbed, 1 - rung.translation]);
      this.aiTargets[index]!.setAttribute("data-tip", `${ai}% absorbed by AI`);
      this.aiTargets[index]!.setAttribute("data-tip-label", rung.label);
      const breakdown = [`${ai}% absorbed by AI`, `${people}% translation by people`, `${meaning}% meaningmaking`].join(
        ", "
      );
      this.barTargets[index]!.setAttribute("data-tip", breakdown);
      this.barTargets[index]!.setAttribute("data-tip-label", rung.label);
      this.barTargets[index]!.setAttribute("aria-label", `${rung.label}: ${breakdown}`);
      this.shareTargets[index]!.textContent = ai! > 0 ? `${ai}% AI` : "";
    });

    const share = Math.round((absorbedTotal / this.rungsValue.length) * 100);
    this.summaryTarget.textContent = `AI does ${share}% of the ladder’s work`;
    syncSlider(this.capabilityTarget, `${this.capabilityTarget.value}%: AI does ${share}% of the ladder’s work`);
  }
}
