import { Component } from '../base/Component';

export class Gallery extends Component<{ catalog: HTMLElement[] }> {
  constructor(container: HTMLElement) {
    super(container);
  }

  set catalog(value: HTMLElement[]) {
    this.container.innerHTML = '';
    value.forEach(item => this.container.appendChild(item));
  }
}
