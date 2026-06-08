import './scss/styles.scss';
import {Api} from './components/base/Api';
import {API_URL} from './utils/constants';
// import { apiProducts } from './utils/data';
import {CatalogModel} from "./components/models/CatalogModels.ts";
import {BasketModel} from "./components/models/BasketModel.ts";
// import {BuyerModel} from "./components/models/BuyerModel.ts";
import {LarekApi} from "./components/models/LarekApi.ts";
import {EventEmitter} from "./components/base/Events.ts";
import {Page} from './components/view/Page';
import {Modal} from './components/view/Modal';
import {Basket} from './components/view/Basket';
import {CatalogCard} from './components/view/CatalogCard';
import {PreviewCard} from './components/view/PreviewCard';
import {BasketCard} from './components/view/BasketCard';
import {OrderForm} from './components/view/OrderForm';
// import { ContactsForm } from './components/view/ContactsForm';
// import {Success} from './components/view/Success';
import {IApi, IProduct} from './types';

// ─── Базовые классы ──────────────────────────────────────────

const events = new EventEmitter();
const baseApi = new Api(API_URL);
const api = new LarekApi(baseApi as IApi);

// ─── Модели ──────────────────────────────────────────

const catalogModel = new CatalogModel(events);
const basketModel = new BasketModel(events);
// const orderModel = new OrderModel(events);

// ─── Представления ──────────────────────────────────────────
const page = new Page(document.body, events);

const modalContainer = document.querySelector('#modal-container');
if (!modalContainer) throw new Error('Modal container not found');
const modal = new Modal(modalContainer as HTMLElement, events);

const basketTemplate = document.querySelector('#basket') as HTMLTemplateElement;
if (!basketTemplate) throw new Error('Basket template not found');
const basketView = new Basket(basketTemplate.content.cloneNode(true) as HTMLElement, events);

const successTemplate = document.querySelector('#success') as HTMLTemplateElement;
if (!successTemplate) throw new Error('Success template not found');
// const successView = new Success(successTemplate.content.cloneNode(true) as HTMLElement, events);

// ─── Загрузка каталога ──────────────────────────────────────────
api.getProducts()
  .then(({items}) => {
    catalogModel.setItems(items)
  })
  .catch(console.error);

// ─── Обработчики событий ──────────────────────────────────────────

// Каталог загружен — рендерим карточки
events.on('catalog:changed', (items: IProduct[]) => {
  const cardTemplate = document.querySelector('#card-catalog') as HTMLTemplateElement;
  if (!cardTemplate) throw new Error('Catalog card template not found');

  const cards = items.map(item => {
    const cardElement = (cardTemplate.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
    const card = new CatalogCard(cardElement, events, item.id);
    card.render(item);
    return cardElement;
  })

  page.catalog = cards;
})

// Выбран товар для просмотра — открываем превью
events.on('preview:changed', (product: IProduct) => {
  const previewTemplate = document.querySelector('#card-preview') as HTMLTemplateElement;
  if (!previewTemplate) throw new Error('Preview card template not found');
  const cardElement = previewTemplate.content.cloneNode(true) as HTMLElement;
  const previewCard = new PreviewCard(cardElement, events, product.id);
  previewCard.render(product);
  previewCard.buttonText = basketModel.hasItem(product.id) ? 'Удалить из корзины' : 'В корзину';
  modal.content = cardElement;
  modal.open();
});

// Корзина изменилась — обновляем счётчик и содержимое корзины
events.on('basket:changed', () => {
  page.counter = basketModel.getCount();

  const basketCardTemplate = document.querySelector('#card-basket') as HTMLTemplateElement;
  if (!basketCardTemplate) return;

  const items = basketModel.getItems();
  const cards = items.map((item, index) => {
    const cardElement = (basketCardTemplate.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
    const basketCard = new BasketCard(cardElement, events, item.id);
    basketCard.render(item);
    basketCard.index = index + 1;
    return cardElement;
  });

  basketView.items = cards;
  basketView.total = basketModel.getTotal();
  basketView.buttonDisabled = items.length === 0;
});

events.on('card:toggleBasket', ({id}: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (basketModel.hasItem(id)) {
    basketModel.removeItem(id);
  } else {
    if (product) basketModel.addItem(product);
  }
  const previewProduct = catalogModel.getPreview();
  if (previewProduct && previewProduct.id === id) {
    catalogModel.setPreview(previewProduct);
  }
});

events.on('basket:changed', () => {
  page.counter = basketModel.getCount();
});

events.on('basket:open', () => {
  const items = basketModel.getItems();
  const basketCardTemplate = document.querySelector('#card-basket') as HTMLTemplateElement;
  if (!basketCardTemplate) throw new Error('Basket card template not found');
  const cards = items.map((item, index) => {
    const cardElement = basketCardTemplate.content.cloneNode(true) as HTMLElement;
    const basketCard = new BasketCard(cardElement, events, item.id);
    basketCard.render(item);
    basketCard.index = index + 1;
    return cardElement;
  });
  basketView.items = cards;
  basketView.total = basketModel.getTotal();
  basketView.buttonDisabled = items.length === 0;
  modal.content = basketView.render();
  modal.open();
});

events.on('basket:checkout', () => {
  const orderTemplate = document.querySelector('#order') as HTMLTemplateElement;
  if (!orderTemplate) throw new Error('Order template not found');
  const orderFormElement = orderTemplate.content.cloneNode(true) as HTMLFormElement;
  const orderForm = new OrderForm(orderFormElement, events);
  modal.content = orderForm.render();
  modal.open();
});

events.on('card:select', ({id}: { id: string }) => {
  console.log('card:select получен, id:', id);
  const product = catalogModel.getProductById(id);
  console.log('Найден продукт:', product);
  if (product) catalogModel.setPreview(product);
});

events.on('preview:changed', (product: IProduct) => {
  console.log('preview:changed', product);
  // ....
});