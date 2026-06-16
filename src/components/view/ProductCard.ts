import { Card } from './Card';
import { categoryMap, CDN_URL } from '../../utils/constants';

export class ProductCard extends Card {
  protected _image: HTMLImageElement;
  protected _category: HTMLElement;

  constructor(container: HTMLElement) {
    super(container);
    this._image = container.querySelector('.card__image')!;
    this._category = container.querySelector('.card__category')!;
  }

  set image(value: string) {
    if (this._image) {
      const fullUrl = value.startsWith('http') ? value : CDN_URL + value;
      this.setImage(this._image, fullUrl, this._title?.textContent || '');
    }
  }

  set category(value: string) {
    if (this._category) {
      this._category.textContent = value;
      const modifier = categoryMap[value as keyof typeof categoryMap] || 'card__category_other';
      const classesToRemove = Array.from(this._category.classList).filter(c => c.startsWith('card__category_'));
      classesToRemove.forEach(c => this._category.classList.remove(c));
      this._category.classList.add(modifier);
    }
  }
}
