export default class StorageService {
  constructor($window, JiveCakeLocalStorage) {
    this.$window = $window;
    this.JiveCakeLocalStorage = JiveCakeLocalStorage;

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
      result = new this.JiveCakeLocalStorage();
      result.timeCreated = new this.$window.Date().getTime();
      this.write(result);
    } else {
      let json;

      try {
        json = this.$window.JSON.parse(string);
      } catch(e) {
        json = null;
      }

      result = new this.JiveCakeLocalStorage();

      if (json === null) {
        result.timeCreated = new this.$window.Date().getTime();
        this.write(result);
      } else {
        for (let key in result) {
          if (key in json) {
            result[key] = json[key];
          }
        }
      }
    }

    return result;
  }

  reset() {
    const storage = new this.JiveCakeLocalStorage();
    storage.timeCreated = new this.$window.Date().getTime();
    this.write(storage);
  }
}

StorageService.$inject = [
  '$window',
  'JiveCakeLocalStorage'
];