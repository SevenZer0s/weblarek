import { Card } from './Card';
import { IEvents } from '../base/Events';
import { IProduct } from '../../types';

export class CatalogCard extends Card {
  private _id: string;

  constructor(container: HTMLElement, protected events: IEvents, id: string) {
    super(container);
    this._id = id;
    this.attachHandler();
  }

  private attachHandler() {
    // Убедимся, что container — это не фрагмент
    if (this.container && this.container.nodeType === Node.ELEMENT_NODE) {
      this.container.onmousedown = () => {
        console.log('Card clicked (mousedown), emitting card:select', this._id);
        this.events.emit('card:select', { id: this._id });
      };
    } else {
      console.warn('CatalogCard: container не является элементом', this.container);
    }
  }

  render(data?: Partial<IProduct>): HTMLElement {
    const result = super.render(data);
    this.attachHandler(); // повторно привязываем обработчик на случай, если render перезаписал container
    return result;
  }
}