import { Controller } from "@hotwired/stimulus";
import { quadrantFor, toX, toY } from "../../lib/viz/strategy-map";
import { eventIndex, setAttributes, setPressed } from "./helpers";

interface Company {
  name: string;
  y: number;
  note: string;
}

interface Profession {
  name: string;
  companies: Company[];
}

interface Role {
  name: string;
  x: number;
}

// Shows the same profession landing in different quadrants depending on the
// company and on how much of the job is deciding rather than executing.
export default class ProfessionMapController extends Controller {
  static override values = { professions: Array, roles: Array };
  static override targets = [
    "professionButton",
    "companyButton",
    "roleButton",
    "dot",
    "ghost",
    "connector",
    "quadrant",
    "note",
    "description",
  ];

  declare readonly professionsValue: Profession[];
  declare readonly rolesValue: Role[];
  declare readonly professionButtonTargets: HTMLButtonElement[];
  declare readonly companyButtonTargets: HTMLButtonElement[];
  declare readonly roleButtonTargets: HTMLButtonElement[];
  declare readonly dotTarget: SVGCircleElement;
  declare readonly ghostTarget: SVGCircleElement;
  declare readonly connectorTarget: SVGLineElement;
  declare readonly quadrantTarget: HTMLElement;
  declare readonly noteTarget: HTMLElement;
  declare readonly descriptionTarget: HTMLElement;

  private profession = 0;
  private company = 0;
  private role = 0;

  override connect() {
    this.render();
  }

  selectProfession(event: Event) {
    this.profession = eventIndex(event);
    this.render();
  }

  selectCompany(event: Event) {
    this.company = eventIndex(event);
    this.render();
  }

  selectRole(event: Event) {
    this.role = eventIndex(event);
    this.render();
  }

  private render() {
    const profession = this.professionsValue[this.profession]!;
    const company = profession.companies[this.company]!;
    const other = profession.companies[1 - this.company]!;
    const x = this.rolesValue[this.role]!.x;

    setPressed(this.professionButtonTargets, this.profession);
    setPressed(this.companyButtonTargets, this.company);
    setPressed(this.roleButtonTargets, this.role);
    this.companyButtonTargets.forEach((button, index) => {
      button.textContent = profession.companies[index]!.name;
    });

    setAttributes(this.dotTarget, { cx: toX(x), cy: toY(company.y) });
    setAttributes(this.ghostTarget, { cx: toX(x), cy: toY(other.y) });
    setAttributes(this.connectorTarget, { x1: toX(x), x2: toX(x), y1: toY(company.y), y2: toY(other.y) });

    const quadrant = quadrantFor(x, company.y);
    this.quadrantTarget.textContent = `${profession.name} · ${company.name}: ${quadrant.name}`;
    this.noteTarget.textContent = company.note;
    this.descriptionTarget.textContent = quadrant.text;
  }
}
