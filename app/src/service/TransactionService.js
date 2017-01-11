export default class TransactionService {
  constructor($q, $http, Transaction, settings, toolsService, relationalService, SearchEntity) {
    this.$q = $q;
    this.$http = $http;
    this.Transaction = Transaction;
    this.settings = settings;
    this.toolsService = toolsService;
    this.relationalService = relationalService;
    this.SearchEntity = SearchEntity;

    this.settings = settings;
  }

  create(token, itemId, body) {
    const url = [this.settings.jivecakeapi.uri, 'item', itemId, 'transaction'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  searchUsers(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', 'user'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', 'search'].join('/');

    return this.$http.get(url, {
      params: params
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  delete(token, transactionId) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', transactionId].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  revoke(token, transactionId) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', transactionId, 'revoke'].join('/');

    return this.$http.post(url, null, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  purchase(token, id, body) {
    const url = [this.settings.jivecakeapi.uri, 'item', id, 'purchase'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  transfer(token, id, user_id) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', id, 'transfer', user_id].join('/');

    return this.$http.post(url, '', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data.map(this.toObject, this));
  }

  getTransactionData(itemService, token, query) {
    return this.search(token, query).then((searchResult) => {
      const transactionIds = searchResult.entity.map(transaction => transaction.id);
      const itemIds = searchResult.entity.map(transaction => transaction.itemId);

      const usersFuture = transactionIds.length === 0 ? this.$q.resolve([]) : this.searchUsers(token, {
        id: transactionIds
      });
      const itemsFuture = itemIds.length === 0 ? this.$q.resolve(new this.SearchEntity()) : itemService.publicSearch({
        id: itemIds
      });

      return this.$q.all({
        user: usersFuture,
        item: itemsFuture
      }).then((resolve) => {
        const users = resolve.user;
        const items = resolve.item.entity;
        const transactions = searchResult.entity;

        const itemMap = this.relationalService.groupBy(items, true, item => item.id);
        const userMap = this.relationalService.groupBy(users, true, user => user.user_id);

        const transactionData = transactions.map(function(transaction) {
          const result = {
            transaction: transaction,
            user: null,
            item: null
          };

          if (transaction.user_id in userMap) {
            result.user = userMap[transaction.user_id];
          }

          if (transaction.itemId in itemMap) {
            result.item = itemMap[transaction.itemId];
          }

          return result;
        });

        return {
          entity: transactionData,
          count: searchResult.count
        };
      });
    });
  }

  getPaymentCompleteStatus() {
    return 0;
  }

  getPaymentPendingStatus() {
    return 1;
  }

  getInvalidPaymentStatus() {
    return 2;
  }

  getMalformedDataStatus() {
    return 3;
  }

  getRefundedStatus() {
    return 4;
  }

  getRevokedStatus() {
    return 5;
  }

  getPendingWithValidPayment() {
      return 6;
  }

  getPendingWithInvalidPayment() {
      return 7;
  }

  getTransferredStatus() {
    return 8;
  }

  getUsedForCountingStatuses() {
    return [
      this.getPaymentCompleteStatus(),
      this.getPaymentPendingStatus(),
      this.getPendingWithValidPayment()
    ];
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Transaction);
  }
}

TransactionService.$inject = ['$q', '$http', 'Transaction', 'settings', 'ToolsService', 'RelationalService', 'SearchEntity'];