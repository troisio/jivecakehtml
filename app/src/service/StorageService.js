export default class StorageService {
  constructor($window, JiveCakeLocalStorage, Cart, DataCount) {
    this.$window = $window;
    this.JiveCakeLocalStorage = JiveCakeLocalStorage;
    this.Cart = Cart;
    this.DataCount = DataCount;

    this.localStorageKey = 'jivecakelocalstorage';
  }

  write(storage) {
    const data = this.$window.JSON.stringify(storage);
    this.$window.localStorage.setItem(this.localStorageKey, data);
  }

  read() {
    const string = this.$window.localStorage.getItem(this.localStorageKey);
    let result;

    if (string === null) {
      const storage = new this.JiveCakeLocalStorage();
      storage.timeCreated = new this.$window.Date().getTime();
      this.write(storage);
      result = storage;
    } else {
      let json;

      try {
        json = this.$window.JSON.parse(string);
      } catch(e) {
        json = null;
      }

      if (json === null) {
        const storage = new this.JiveCakeLocalStorage();
        storage.timeCreated = new this.$window.Date().getTime();
        this.write(storage);
        result = storage;
      } else {
        const storage = new this.JiveCakeLocalStorage();
        storage.token = json.token;
        storage.profile = json.profile;
        storage.timeCreated = json.timeCreated;

        for (let key in json.cart.data) {
          const datum = json.cart.data[key];
          storage.cart.data[key] = new this.DataCount(datum.data, datum.count);
        }

        result = storage;
      }
    }

    return result;
  }

  reset() {
    const storage = new this.JiveCakeLocalStorage();
    storage.timeCreated = new this.$window.Date().getTime();
    storage.cart = new this.Cart();
    this.write(storage);
  }
}

StorageService.$inject = [
  '$window',
  'JiveCakeLocalStorage',
  'Cart',
  'DataCount'
];