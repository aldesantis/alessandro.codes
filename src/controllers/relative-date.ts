import { Controller } from "@hotwired/stimulus";
import { differenceInDays, formatDistanceToNow } from "date-fns";

// Dates newer than this read better as "3 days ago"; older ones stay absolute.
const RELATIVE_THRESHOLD_DAYS = 30;

export default class RelativeDateController extends Controller<HTMLTimeElement> {
  override connect() {
    const datetime = this.element.getAttribute("datetime");
    if (!datetime) return;

    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) return;

    // Server-rendered text and title are in UTC; switch both to local time.
    this.element.title = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(date);

    const ageInDays = differenceInDays(new Date(), date);

    this.element.textContent =
      ageInDays >= 0 && ageInDays < RELATIVE_THRESHOLD_DAYS
        ? formatDistanceToNow(date, { addSuffix: true })
        : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
  }
}
