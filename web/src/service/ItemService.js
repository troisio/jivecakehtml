export default class ItemService {
  constructor($window, $q, $http, transactionService, settings, toolsService, relationalService, Item) {
    this.$window = $window;
    this.$q = $q;
    this.$http = $http;
    this.transactionService = transactionService;
    this.settings = settings;
    this.toolsService = toolsService;
    this.relationalService = relationalService;
    this.Item = Item;

    this.settings = this.settings;
  }

  create(token, item) {
    let url = [this.settings.jivecakeapi.uri, 'event', item.eventId, 'item'].join('/');

    return this.$http.post(url, item, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Item));
  }

  update(token, item) {
    const url = [this.settings.jivecakeapi.uri, 'item', item.id].join('/');

    return this.$http.post(url, item, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Item));
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'item', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Item));
  }

  getDerivedAmount(item, transactionService) {
    let future;

    if (item.timeAmounts !== null) {
      future = this.$q.resolve(item.getDerivedAmountFromTime(new Date().getTime()));
    } else if (item.countAmounts !== null) {
      future = transactionService.publicSearch({
        itemId: item.id,
        status: [transactionService.SETTLED, transactionService.PENDING],
        paymentStatus: [transactionService.PAYMENT_EQUAL, transactionService.PAYMENT_GREATER_THAN],
        leaf: true
      }).then(searchResult => item.getDerivedAmountFromCounts(searchResult.entity.length));
    } else {
      future = this.$q.resolve(item.amount);
    }

    return future;
  }

  delete(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'item', id].join('/');
    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Item));
  }

  getActiveStatus() {
    return 0;
  }

  getInactiveStatus() {
    return 1;
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Item);
  }
}

ItemService.$inject = ['$window', '$q', '$http', 'TransactionService', 'settings', 'ToolsService', 'RelationalService', 'Item'];