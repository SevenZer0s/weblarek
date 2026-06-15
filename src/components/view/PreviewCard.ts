import { Card, ICardActions } from './Card';

export class PreviewCard extends Card {
  private button: HTMLButtonElement;
  private _description: HTMLElement;

  constructor(container: HTMLElement, actions?: ICardActions) {
    super(container);
    this.button = container.querySelector('.card__button')!;
    this._description = container.querySelector('.card__text')!;
    if (actions?.onClick) {
      this.button.addEventListener('click', actions.onClick);
    }
  }

  set description(value: string) { if (this._description) this._description.textContent = value; }
  set buttonText(value: string) { if (this.button) this.button.textContent = value; }
  set buttonDisabled(value: boolean) { if (this.button) this.button.disabled = value; }
}