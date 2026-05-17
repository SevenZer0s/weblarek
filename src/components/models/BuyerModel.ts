//Хранит данные заказа и умеет их валидировать.

import { IBuyer, TPayment } from '../../types';
import { TValidationErrors } from '../../types';

export class BuyerModel {
  private payment: TPayment | null = null;
  private address: string = '';
  private phone: string = '';
  private email: string = '';

  updateOrder(data: Partial<IBuyer>): void {
    if (data.payment !== undefined) this.payment = data.payment;
    if (data.address !== undefined) this.address = data.address;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.email !== undefined) this.email = data.email;
  }

  getOrder(): IBuyer {
    return {
      payment: this.payment,
      address: this.address,
      phone: this.phone,
      email: this.email,
    };
  }

  clear(): void {
    this.payment = null;
    this.address = '';
    this.phone = '';
    this.email = '';
  }

  validate(): TValidationErrors {
    const errors: TValidationErrors = {};

    // Валидация: проверяем текущие значения
    if (!this.payment) errors.payment = 'Не выбран способ оплаты';
    if (!this.address.trim()) errors.address = 'Адрес не может быть пустым';
    if (!this.phone.trim()) errors.phone = 'Телефон не может быть пустым';
    if (!this.email.trim()) errors.email = 'Email не может быть пустым';

    return errors;
  }
}