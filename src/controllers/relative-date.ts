import { Controller } from "@hotwired/stimulus";
import { formatDistanceToNow } from "date-fns";

export default class RelativeDateController extends Controller {
  override connect() {
    this.updateRelativeDate();
  }

  updateRelativeDate() {
    const absoluteDate = (this.element as HTMLElement).dataset.absoluteDate;

    if (absoluteDate) {
      const date = new Date(absoluteDate);
      this.element.textContent = formatDistanceToNow(date, { addSuffix: true });
    }
  }
}
