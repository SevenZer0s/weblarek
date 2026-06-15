export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';

export interface IApi {
    get<T extends object>(uri: string): Promise<T>;
    post<T extends object>(uri: string, data: object, method?: ApiPostMethods): Promise<T>;
}

export type TPayment = 'online' | 'upon receipt';

// Интерфейс товара
export interface IProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  price: number | null;
}

// Интерфейс данных покупателя
export interface IBuyer {
  payment: TPayment | null;
  email: string;
  phone: string;
  address: string;
}

// Приходит с сервера GET /product/
export interface IProductsResponse {
  items: IProduct[];
  total: number;
}

// Отправляем на сервер POST /order/
export interface IOrder extends IBuyer {
  payment: TPayment; // Переопределяем поле, так как null недопустим к отправке
  total: number;
  items: string[];
}

// Ответ сервера после успешного оформления заказа
export interface IOrderResult {
  id: string;
  total: number;
}

// Тип для объекта с ошибками валидации. Ключ — поля IBuyer, значение — текст ошибки
export type TValidationErrors = Partial<Record<keyof IBuyer, string>>;