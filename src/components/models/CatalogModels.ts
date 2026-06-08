// Отвечает за хранение всех товаров и выбранного товара для просмотра.

import { IProduct } from '../../types';
import {IEvents} from "../base/Events.ts";

export class CatalogModel {
  // Поля
  private items: IProduct[] = [];
  private selectedProduct: IProduct | null = null;

  constructor(protected events: IEvents) {

  }

  // Методы
  setItems(products: IProduct[]): void {
    this.items = products;
    this.events.emit('catalog:changed', this.items)
  }

  getItems(): IProduct[] {
    return this.items;
  }

  getProductById(id: string): IProduct | undefined {
    return this.items.find(product => product.id === id);
  }

  setPreview(product: IProduct): void {
    this.selectedProduct = product;
    this.events.emit('preview:changed', product) // event warn!!
  }

  getPreview(): IProduct | null {
    return this.selectedProduct;
  }
}