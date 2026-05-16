import './scss/styles.scss';
import { Api } from './components/base/Api';
import { API_URL } from './utils/constants';
import { apiProducts } from './utils/data';
import {CatalogModel} from "./components/models/CatalogModels.ts";
import {BasketModel} from "./components/models/BasketModel.ts";
import {OrderModel} from "./components/models/OrderModel.ts";
import {LarekApi} from "./components/models/LarekApi.ts";

// ─── CatalogModel ─────────────────────────────────────────

const catalog = new CatalogModel();
catalog.setItems(apiProducts.items);

console.log('Все товары:', catalog.getItems());
console.log('Товар по id:', catalog.getProductById(apiProducts.items[0].id));

catalog.setPreview(apiProducts.items[0]);
console.log('Выбранный товар:', catalog.getPreview());

// ─── BasketModel ──────────────────────────────────────────

const basket = new BasketModel();
const first = apiProducts.items[0];
const second = apiProducts.items[1];

basket.addItem(first);
basket.addItem(second);
basket.addItem(first); // дубль — не добавится

console.log('Товары в корзине:', basket.getItems());
console.log('Количество:', basket.getCount());
console.log('Сумма:', basket.getTotal());
console.log('Есть первый товар?', basket.hasItem(first.id));

basket.removeItem(first.id);
console.log('После удаления:', basket.getItems());

basket.clear();
console.log('После очистки:', basket.getItems());

// ─── OrderModel ───────────────────────────────────────────

const order = new OrderModel();

order.updateOrder({ address: 'ул. Ленина, 1' });
order.updateOrder({ payment: 'card' });
console.log('Частичное заполнение:', order.getOrder());
console.log('Ошибки (email и phone пустые):', order.validate());

order.updateOrder({ email: 'test@mail.ru', phone: '+79991234567' });
console.log('Полное заполнение:', order.getOrder());
console.log('Ошибок нет:', order.validate());

order.clear();
console.log('После очистки:', order.getOrder());

// ─── LarekApi — запрос на сервер ─────────────────

const api = new Api(API_URL);
const larekApi = new LarekApi(api);

larekApi.getProducts()
  .then((response) => {
    catalog.setItems(response.items);
    console.log('Каталог с сервера:', catalog.getItems());
    console.log('Всего товаров:', response.total);
  })
  .catch((error) => {
    console.error('Ошибка загрузки:', error);
  });
