import Cart from './Cart';

export default class JiveCakeLocalStorage {
  constructor() {
    this.token = null;
    this.profile = null;
    this.cart = new Cart();
    this.timeCreated = null;
  }
}