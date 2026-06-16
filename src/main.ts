import './scss/styles.scss';
import { Api } from './components/base/Api';
import { API_URL } from './utils/constants';
import { CatalogModel } from './components/models/CatalogModels';
import { BasketModel } from './components/models/BasketModel';
import { BuyerModel } from './components/models/BuyerModel';
import { LarekApi } from './components/models/LarekApi';
import { EventEmitter } from './components/base/Events';
import { Header } from './components/view/Header';
import { Gallery } from './components/view/Gallery';
import { Modal } from './components/view/Modal';
import { Basket } from './components/view/Basket';
import { CatalogCard } from './components/view/CatalogCard';
import { PreviewCard } from './components/view/PreviewCard';
import { BasketCard } from './components/view/BasketCard';
import { OrderForm } from './components/view/OrderForm';
import { ContactsForm } from './components/view/ContactsForm';
import { Success } from './components/view/Success';
import { cloneTemplate } from './utils/utils';
import { IApi, IOrder, IProduct, TPayment } from './types';

// ─── Базовые классы ───────────────────────────────────────────
const events = new EventEmitter();
const baseApi = new Api(API_URL);
const api = new LarekApi(baseApi as IApi);

// ─── Модели ───────────────────────────────────────────────────
const catalogModel = new CatalogModel(events);
const basketModel = new BasketModel(events);
const buyerModel = new BuyerModel(events);

// ─── Представления ────────────────────────────────────────────
const header = new Header(document.querySelector('.header') as HTMLElement, events);
const gallery = new Gallery(document.querySelector('.gallery') as HTMLElement);

const modal = new Modal(document.querySelector('#modal-container') as HTMLElement, events);

const basketView = new Basket(cloneTemplate('#basket'), events);
const previewCard = new PreviewCard(cloneTemplate('#card-preview'), {
  onClick: () => {
    const product = catalogModel.getPreview();
    if (product) events.emit('card:toggleBasket', { id: product.id });
  },
});
const orderForm = new OrderForm(cloneTemplate<HTMLFormElement>('#order'), events);
const contactsForm = new ContactsForm(cloneTemplate<HTMLFormElement>('#contacts'), events);
const successView = new Success(cloneTemplate('#success'), events);

// ─── Загрузка каталога ────────────────────────────────────────
api.getProducts()
  .then(({ items }) => catalogModel.setItems(items))
  .catch(console.error);

// ─── Обработчики событий ──────────────────────────────────────

events.on('catalog:changed', (items: IProduct[]) => {
  const cards = items.map(item => {
    const card = new CatalogCard(cloneTemplate('#card-catalog'), {
      onClick: () => events.emit('card:select', { id: item.id }),
    });
    return card.render(item);
  });
  gallery.catalog = cards;
});

events.on('card:select', ({ id }: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (product) catalogModel.setPreview(product);
});

events.on('preview:changed', () => {
  const product = catalogModel.getPreview();
  if (!product) return;
  const el = previewCard.render(product);
  if (product.price === null) {
    previewCard.buttonText = 'Недоступно';
    previewCard.buttonDisabled = true;
  } else {
    previewCard.buttonText = basketModel.hasItem(product.id) ? 'Удалить из корзины' : 'В корзину';
    previewCard.buttonDisabled = false;
  }
  modal.content = el;
  modal.open();
});

events.on('card:toggleBasket', ({ id }: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (basketModel.hasItem(id)) {
    basketModel.removeItem(id);
  } else {
    if (product) basketModel.addItem(product);
  }
  modal.close();
});

events.on('basket:changed', () => {
  header.counter = basketModel.getCount();
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
});

events.on('basket:open', () => {
  modal.content = basketView.render();
  modal.open();
});

events.on('basket:remove', ({ id }: { id: string }) => {
  basketModel.removeItem(id);
});

events.on('basket:checkout', () => {
  modal.content = orderForm.render();
  modal.open();
});

// Изменение полей формы заказа (шаг 1) → сохраняем в модель
events.on('order.address:change', ({ value }: { field: string; value: string }) => {
  buyerModel.updateOrder({ address: value });
});

events.on('order.payment:change', ({ payment }: { payment: TPayment }) => {
  buyerModel.updateOrder({ payment });
});

// Изменение полей формы контактов (шаг 2) → сохраняем в модель
events.on('contacts.email:change', ({ value }: { field: string; value: string }) => {
  buyerModel.updateOrder({ email: value });
});

events.on('contacts.phone:change', ({ value }: { field: string; value: string }) => {
  buyerModel.updateOrder({ phone: value });
});

// Любое изменение данных покупателя → обновляем валидацию активной формы.
// order:changed приходит от BuyerModel после каждого updateOrder/clear.
events.on('order:changed', () => {
  const order = buyerModel.getOrder();
  const errors = buyerModel.validate();

  orderForm.selectedPayment = order.payment;
  orderForm.address = order.address;
  orderForm.valid = !errors.payment && !errors.address;
  orderForm.errors = [errors.payment, errors.address].filter(Boolean).join('. ');

  contactsForm.email = order.email;
  contactsForm.phone = order.phone;
  contactsForm.valid = !errors.email && !errors.phone;
  contactsForm.errors = [errors.email, errors.phone].filter(Boolean).join('. ');
});

// Переход ко второй форме
events.on('order:submit', () => {
  modal.content = contactsForm.render();
  modal.open();
});

// Отправка заказа на сервер
events.on('contacts:submit', () => {
  const order = buyerModel.getOrder();
  api.postOrder({
    ...order,
    payment: order.payment as TPayment,
    total: basketModel.getTotal(),
    items: basketModel.getItems().map(i => i.id),
  } as IOrder)
    .then(result => {
      basketModel.clear();
      buyerModel.clear();
      successView.total = result.total;
      modal.content = successView.render();
    })
    .catch(console.error);
});

events.on('success:close', () => {
  modal.close();
});

