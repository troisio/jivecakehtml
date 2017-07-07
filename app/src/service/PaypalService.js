export default class PaypalService {
  constructor($http, settings, itemService, transactionService) {
    this.$http = $http;
    this.settings = settings;
    this.itemService = itemService;
    this.transactionService = transactionService;
  }

  refund(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', id, 'refund'].join('/');

    return this.$http.post(url, null, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  execute(token, body) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', 'payment', 'execute'].join('/');

    const options = {};

    if (token !== null) {
      options.headers = {
        Authorization: 'Bearer ' + token
      };
    }

    return this.$http.post(url, body, options).then(response => response.data);
  }

  getPayment(token, transactionId) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', transactionId, 'payment'].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  generatePayment(token, eventId, body) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', eventId, 'order'].join('/');

    const options = {};

    if (token !== null) {
      options.headers = {
        Authorization: 'Bearer ' + token
      };
    }

    return this.$http.post(url, body, options).then(response => response.data);
  }
}

PaypalService.$inject = ['$http', 'settings', 'ItemService', 'TransactionService'];