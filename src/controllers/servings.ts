import { Controller } from "@hotwired/stimulus";
import { formatIngredientDetails } from "../lib/recipes/format";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

export default class ServingsController extends Controller {
  static override values = { base: Number };
  static override targets = ["count", "quantity", "decrement", "increment"];

  declare readonly baseValue: number;
  declare readonly countTarget: HTMLElement;
  declare readonly quantityTargets: HTMLElement[];
  declare readonly decrementTarget: HTMLButtonElement;
  declare readonly incrementTarget: HTMLButtonElement;
  declare readonly hasDecrementTarget: boolean;
  declare readonly hasIncrementTarget: boolean;

  private servings = MIN_SERVINGS;

  // Recipes that already serve more than the default cap can still be shown
  // at (and scaled down from) their own size.
  private get max(): number {
    return Math.max(MAX_SERVINGS, this.baseValue);
  }

  override connect() {
    this.servings = this.baseValue;
    this.syncButtons();
  }

  increment() {
    this.update(this.servings + 1);
  }

  decrement() {
    this.update(this.servings - 1);
  }

  private update(servings: number) {
    this.servings = Math.min(Math.max(servings, MIN_SERVINGS), this.max);
    this.countTarget.textContent = String(this.servings);
    this.syncButtons();
    this.rescale();
  }

  private syncButtons() {
    if (this.hasDecrementTarget) this.decrementTarget.disabled = this.servings <= MIN_SERVINGS;
    if (this.hasIncrementTarget) this.incrementTarget.disabled = this.servings >= this.max;
  }

  private rescale() {
    for (const target of this.quantityTargets) {
      const baseQuantity = Number(target.dataset.quantity);
      const scaled = (baseQuantity * this.servings) / this.baseValue;

      target.textContent = formatIngredientDetails(scaled, target.dataset.unit, target.dataset.note || undefined);
    }
  }
}
