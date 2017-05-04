export default class ItemService {
  constructor($window, $q, $http, transactionService, settings, toolsService, relationalService, Organization, Item) {
    this.$window = $window;
    this.$q = $q;
    this.$http = $http;
    this.transactionService = transactionService;
    this.settings = settings;
    this.toolsService = toolsService;
    this.relationalService = relationalService;
    this.Organization = Organization;
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
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'item', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => this.toObject(response.data));
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'item', 'search'].join('/');

    return this.$http.get(url, {
      params: params,
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'item'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  getDerivedAmounts(items, transactionService) {
    let future;

    if (items.length === 0) {
      future = this.$q.resolve([]);
    } else {
      const time = new this.$window.Date().getTime();

      future = transactionService.publicSearch({
        itemId: items.map(item => item.id),
        status: transactionService.getUsedForCountingStatuses(),
        leaf: true
      }).then(searchResult => {
        const transactionMap = this.relationalService.groupBy(
          searchResult.entity,
          false,
          transaction => transaction.itemId
        );

        return items.map(function(item) {
          let result;

          if (item.timeAmounts !== null) {
            result = item.getDerivedAmountFromTime(time);
          } else if (item.countAmounts !== null) {
            const count = transactionMap[item.id].reduce((total, transaction) => total + transaction.quantity, 0);
            result = item.getDerivedAmountFromCounts(count);
          } else {
            result = item.amount;
          }

          return result;
        });
      });
    }

    return future;
  }

  getDerivedAmount(item, transactionService) {
    let future;

    if (item.timeAmounts !== null) {
      future = this.$q.resolve(item.getDerivedAmountFromTime(new this.$window.Date().getTime()));
    } else if (item.countAmounts !== null) {
      future = transactionService.publicSearch({
        itemId: item.id,
        status: transactionService.getUsedForCountingStatuses(),
        leaf: true
      }).then(function(searchResult) {
        return item.getDerivedAmountFromCounts(searchResult.entity.length);
      });
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
    });
  }

  getActiveStatus() {
    return 0;
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Item);
  }
}

ItemService.$inject = ['$window', '$q', '$http', 'TransactionService', 'settings', 'ToolsService', 'RelationalService', 'Organization', 'Item'];