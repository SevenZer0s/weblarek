import { ProductCard } from './ProductCard';
import { ICardActions } from './Card';

export class CatalogCard extends ProductCard {
  constructor(container: HTMLElement, actions?: ICardActions) {
    super(container);
    if (actions?.onClick) {
      container.addEventListener('click', actions.onClick);
    }
  }
}