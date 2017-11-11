export default class StorageService {
  constructor(JiveCakeLocalStorage) {
    this.JiveCakeLocalStorage = JiveCakeLocalStorage;
    this.localStorageKey = 'jivecakelocalstorage';
  }

  write(storage) {
    const data = JSON.stringify(storage);
    localStorage.setItem(this.localStorageKey, data);
  }

  read() {
    const string = localStorage.getItem(this.localStorageKey);
    let result;

    if (string === null) {
      result = new this.JiveCakeLocalStorage();
      result.timeCreated = new Date().getTime();
      this.write(result);
    } else {
      let json;

      try {
        json = JSON.parse(string);
      } catch(e) {
        json = null;
      }

      result = new this.JiveCakeLocalStorage();

      if (json === null) {
        result.timeCreated = new Date().getTime();
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
    storage.timeCreated = new Date().getTime();
    this.write(storage);
  }
}

StorageService.$inject = [
  'JiveCakeLocalStorage'
];