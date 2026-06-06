import { Controller } from "@hotwired/stimulus";
import { formatQuantityWithUnit } from "../lib/recipes/format";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

export default class ServingsController extends Controller {
  static override values = { base: Number };
  static override targets = ["count", "quantity"];

  declare readonly baseValue: number;
  declare readonly countTarget: HTMLElement;
  declare readonly quantityTargets: HTMLElement[];

  private servings = MIN_SERVINGS;

  override connect() {
    this.servings = this.baseValue;
  }

  increment() {
    this.update(this.servings + 1);
  }

  decrement() {
    this.update(this.servings - 1);
  }

  private update(servings: number) {
    this.servings = Math.min(Math.max(servings, MIN_SERVINGS), MAX_SERVINGS);
    this.countTarget.textContent = String(this.servings);
    this.rescale();
  }

  private rescale() {
    for (const target of this.quantityTargets) {
      const baseQuantity = Number(target.dataset.quantity);
      const scaled = (baseQuantity * this.servings) / this.baseValue;

      target.textContent = formatQuantityWithUnit(scaled, target.dataset.unit);
    }
  }
}
