import { Form } from './Form';
import { IEvents } from '../base/Events';
import { ensureElement } from '../../utils/utils';
import { TPayment } from '../../types';

export class OrderForm extends Form<{ address: string; payment: string }> {
  private cardButton: HTMLButtonElement;
  private cashButton: HTMLButtonElement;
  private addressInput: HTMLInputElement;

  constructor(container: HTMLFormElement, events: IEvents) {
    super(container, events);
    this.cardButton = ensureElement<HTMLButtonElement>('button[name="card"]', container);
    this.cashButton = ensureElement<HTMLButtonElement>('button[name="cash"]', container);
    this.addressInput = ensureElement<HTMLInputElement>('input[name="address"]', container);

    this.cardButton.addEventListener('click', () => {
      this.events.emit('order.payment:change', { payment: 'online' });
    });
    this.cashButton.addEventListener('click', () => {
      this.events.emit('order.payment:change', { payment: 'upon receipt' });
    });
  }

  set address(value: string) {
    this.addressInput.value = value;
  }

  // Подсвечивает кнопку выбранного способа оплаты.
  // Вызывается из Presenter при обработке order:changed, чтобы
  // синхронизировать UI с состоянием модели.
  set selectedPayment(value: TPayment | null) {
    this.cardButton.classList.toggle('button_alt-active', value === 'online');
    this.cashButton.classList.toggle('button_alt-active', value === 'upon receipt');
  }
}