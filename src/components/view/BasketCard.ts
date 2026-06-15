import { Card, ICardActions } from './Card';

export class BasketCard extends Card {
  private indexElement: HTMLElement;
  private deleteButton: HTMLButtonElement;

  constructor(container: HTMLElement, actions?: ICardActions) {
    super(container);
    this.indexElement = container.querySelector('.basket__item-index')!;
    this.deleteButton = container.querySelector('.basket__item-delete')!;
    if (actions?.onClick) {
      this.deleteButton.addEventListener('click', actions.onClick);
    }
  }

  set index(value: number) {
    if (this.indexElement) this.indexElement.textContent = String(value);
  }
}