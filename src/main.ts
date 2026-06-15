import './scss/styles.scss';
import { Api } from './components/base/Api';
import { API_URL } from './utils/constants';
import { CatalogModel } from './components/models/CatalogModels';
import { BasketModel } from './components/models/BasketModel';
import { LarekApi } from './components/models/LarekApi';
import { EventEmitter } from './components/base/Events';
import { Page } from './components/view/Page';
import { Modal } from './components/view/Modal';
import { Basket } from './components/view/Basket';
import { CatalogCard } from './components/view/CatalogCard';
import { PreviewCard } from './components/view/PreviewCard';
import { BasketCard } from './components/view/BasketCard';
import { OrderForm } from './components/view/OrderForm';
import { cloneTemplate } from './utils/utils';
import { IApi, IProduct } from './types';

// ─── Базовые классы ───────────────────────────────────────────
const events = new EventEmitter();
const baseApi = new Api(API_URL);
const api = new LarekApi(baseApi as IApi);

// ─── Модели ───────────────────────────────────────────────────
const catalogModel = new CatalogModel(events);
const basketModel = new BasketModel(events);

// ─── Представления ────────────────────────────────────────────
const page = new Page(document.body, events);

const modalContainer = document.querySelector('#modal-container');
if (!modalContainer) throw new Error('Modal container not found');
const modal = new Modal(modalContainer as HTMLElement, events);

// ─── Загрузка каталога ────────────────────────────────────────
api.getProducts()
  .then(({ items }) => catalogModel.setItems(items))
  .catch(console.error);

// ─── Обработчики событий ──────────────────────────────────────

// Каталог загружен — рендерим карточки
events.on('catalog:changed', (items: IProduct[]) => {
  const cards = items.map(item => {
    const card = new CatalogCard(cloneTemplate('#card-catalog'), {
      onClick: () => events.emit('card:select', { id: item.id }),
    });
    return card.render(item);
  });
  page.catalog = cards;
});

// Выбран товар для просмотра — открываем превью
events.on('preview:changed', (product: IProduct) => {
  const previewCard = new PreviewCard(cloneTemplate('#card-preview'), {
    onClick: () => events.emit('card:toggleBasket', { id: product.id }),
  });
  previewCard.render(product);
  previewCard.buttonText = basketModel.hasItem(product.id) ? 'Удалить из корзины' : 'В корзину';
  previewCard.buttonDisabled = product.price === null;
  modal.content = previewCard.render();
  modal.open();
});

// Корзина изменилась — обновляем счётчик страницы
// (содержимое корзины перерисовывается только при basket:open)
events.on('basket:changed', () => {
  page.counter = basketModel.getCount();
});

// Открыта корзина — рендерим содержимое и показываем модалку
events.on('basket:open', () => {
  const basketView = new Basket(cloneTemplate('#basket'), events);
  const items = basketModel.getItems();
  const cards = items.map((item, index) => {
    const card = new BasketCard(cloneTemplate('#card-basket'), {
      onClick: () => events.emit('basket:remove', { id: item.id }),
    });
    card.render(item);
    card.index = index + 1;
    return card.render();
  });
  basketView.items = cards;
  basketView.total = basketModel.getTotal();
  basketView.buttonDisabled = items.length === 0;
  modal.content = basketView.render();
  modal.open();
});

// Удаление товара из корзины
events.on('basket:remove', ({ id }: { id: string }) => {
  basketModel.removeItem(id);
});

// Нажата кнопка "В корзину" / "Удалить из корзины" в превью
events.on('card:toggleBasket', ({ id }: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (basketModel.hasItem(id)) {
    basketModel.removeItem(id);
  } else {
    if (product) basketModel.addItem(product);
  }
  // Обновляем текст кнопки в превью через повторный эмит preview:changed
  const previewProduct = catalogModel.getPreview();
  if (previewProduct && previewProduct.id === id) {
    catalogModel.setPreview(previewProduct);
  }
});

// Клик по карточке в каталоге
events.on('card:select', ({ id }: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (product) catalogModel.setPreview(product);
});

// Переход к оформлению заказа
events.on('basket:checkout', () => {
  const orderForm = new OrderForm(cloneTemplate<HTMLFormElement>('#order'), events);
  modal.content = orderForm.render();
  modal.open();
});