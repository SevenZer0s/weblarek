import './scss/styles.scss';
import { Api } from './components/base/Api';
import { API_URL } from './utils/constants';
import { CatalogModel } from './components/models/CatalogModels';
import { BasketModel } from './components/models/BasketModel';
import { BuyerModel } from './components/models/BuyerModel';
import { LarekApi } from './components/models/LarekApi';
import { EventEmitter } from './components/base/Events';
import { Page } from './components/view/Page';
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
const page = new Page(document.body, events);

const modal = new Modal(document.querySelector('#modal-container') as HTMLElement, events);

const basketView = new Basket(cloneTemplate('#basket'), events);

let orderForm: OrderForm | null = null;
let contactsForm: ContactsForm | null = null;

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
  page.catalog = cards;
});

events.on('card:select', ({ id }: { id: string }) => {
  const product = catalogModel.getProductById(id);
  if (product) catalogModel.setPreview(product);
});

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
  page.counter = basketModel.getCount();
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
  orderForm = new OrderForm(cloneTemplate<HTMLFormElement>('#order'), events);
  // Синхронизируем начальное состояние формы с моделью
  const order = buyerModel.getOrder();
  const errors = buyerModel.validate();
  orderForm.selectedPayment = order.payment;
  orderForm.address = order.address;
  orderForm.valid = !errors.payment && !errors.address;
  orderForm.errors = [errors.payment, errors.address].filter(Boolean).join('. ');
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

  if (orderForm) {
    orderForm.selectedPayment = order.payment;
    orderForm.address = order.address;
    orderForm.valid = !errors.payment && !errors.address;
    orderForm.errors = [errors.payment, errors.address].filter(Boolean).join('. ');
  }

  if (contactsForm) {
    contactsForm.valid = !errors.email && !errors.phone;
    contactsForm.errors = [errors.email, errors.phone].filter(Boolean).join('. ');
  }
});

// Переход ко второй форме
events.on('order:submit', () => {
  contactsForm = new ContactsForm(cloneTemplate<HTMLFormElement>('#contacts'), events);
  const errors = buyerModel.validate();
  contactsForm.valid = !errors.email && !errors.phone;
  contactsForm.errors = [errors.email, errors.phone].filter(Boolean).join('. ');
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
      const successView = new Success(cloneTemplate('#success'), events);
      successView.total = result.total;
      modal.content = successView.render();
    })
    .catch(console.error);
});

events.on('success:close', () => {
  modal.close();
});

// При закрытии модалки сбрасываем ссылки на формы
events.on('modal:close', () => {
  orderForm = null;
  contactsForm = null;
});