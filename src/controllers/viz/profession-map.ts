import { Controller } from "@hotwired/stimulus";
import { quadrantFor, toX, toY } from "../../lib/viz/strategy-map";

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
    this.profession = this.indexOf(event);
    this.render();
  }

  selectCompany(event: Event) {
    this.company = this.indexOf(event);
    this.render();
  }

  selectRole(event: Event) {
    this.role = this.indexOf(event);
    this.render();
  }

  private indexOf(event: Event) {
    return Number((event.currentTarget as HTMLElement).dataset.index);
  }

  private render() {
    const profession = this.professionsValue[this.profession]!;
    const company = profession.companies[this.company]!;
    const other = profession.companies[1 - this.company]!;
    const x = this.rolesValue[this.role]!.x;

    this.press(this.professionButtonTargets, this.profession);
    this.press(this.companyButtonTargets, this.company);
    this.press(this.roleButtonTargets, this.role);
    this.companyButtonTargets.forEach((button, index) => {
      button.textContent = profession.companies[index]!.name;
    });

    this.dotTarget.setAttribute("cx", String(toX(x)));
    this.dotTarget.setAttribute("cy", String(toY(company.y)));
    this.ghostTarget.setAttribute("cx", String(toX(x)));
    this.ghostTarget.setAttribute("cy", String(toY(other.y)));
    this.connectorTarget.setAttribute("x1", String(toX(x)));
    this.connectorTarget.setAttribute("x2", String(toX(x)));
    this.connectorTarget.setAttribute("y1", String(toY(company.y)));
    this.connectorTarget.setAttribute("y2", String(toY(other.y)));

    const quadrant = quadrantFor(x, company.y);
    this.quadrantTarget.textContent = `${profession.name} · ${company.name}: ${quadrant.name}`;
    this.noteTarget.textContent = company.note;
    this.descriptionTarget.textContent = quadrant.text;
  }

  private press(buttons: HTMLButtonElement[], selected: number) {
    buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === selected)));
  }
}
