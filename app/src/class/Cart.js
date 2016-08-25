import DataCount from './DataCount';

export default class Cart {
  constructor() {
    this.data = {};
  }

  get(id) {
    return this.data[id];
  }

  put(item, count) {
    this.data[item.id] = new DataCount(item.id, count);
  }

  has(id) {
    return id in this.data;
  }

  delete(id) {
    delete this.data[id];
  }
}