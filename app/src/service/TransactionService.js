export default class TransactionService {
  constructor($q, $http, Transaction, settings, toolsService, relationalService, SearchEntity) {
    this.$q = $q;
    this.$http = $http;
    this.Transaction = Transaction;
    this.settings = settings;
    this.toolsService = toolsService;
    this.relationalService = relationalService;
    this.SearchEntity = SearchEntity;

    this.PAYMENT_EQUAL = 0;

    this.SETTLED = 0;
    this.PENDING = 1;
    this.USER_REVOKED = 2;
    this.REFUNDED = 3;
    this.UNKNOWN = 4;

    this.settings = settings;
    this.countingFilter = transaction => transaction.leaf && (transaction.status === this.SETTLED || transaction.status === this.PENDING);
  }

  create(token, itemId, body) {
    const url = [this.settings.jivecakeapi.uri, 'item', itemId, 'transaction'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Transaction));
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => {
      return {
        entity: response.data.entity.map(transaction => this.toolsService.toObject(transaction, this.Transaction)),
        count: response.data.count
      };
    });
  }

  searchUsers(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', 'user'].join('/');
    const futures = [];

    const options = {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    };

    if (Array.isArray(params.id)) {
      const segmentLength = 60;
      const ids = params.id;

      for (let index = 0; index < params.id.length / segmentLength; index++) {
        const start = index * segmentLength;
        const optionsCopy = Object.assign({}, options);
        optionsCopy.params.id = ids.slice(start, start + segmentLength);

        futures.push(
          this.$http.get(url, optionsCopy).then(response => response.data)
        );
      }
    } else {
      futures.push(
        this.$http.get(url, options).then(response => response.data)
      );
    }

    return this.$q.all(futures).then(entities => {
      const result = [];
      entities.forEach(users => result.push.apply(result, users));
      return result;
    });
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => this.toolsService.toObject(response.data, this.Transaction));
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', 'search'].join('/');

    return this.$http.get(url, {
      params: params
    }).then((response) => {
      return {
        entity: response.data.entity.map(transaction => this.toolsService.toObject(transaction, this.Transaction)),
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
    }).then(response => this.toolsService.toObject(response.data, this.Transaction));
  }

  revoke(token, transactionId) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', transactionId, 'revoke'].join('/');

    return this.$http.post(url, null, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Transaction));
  }

  purchase(token, id, body) {
    const url = [this.settings.jivecakeapi.uri, 'item', id, 'purchase'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Transaction));
  }

  getUserAssets(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'transaction', 'asset', 'user'].join('/');
    const futures = [];

    const options = {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    };

    if (Array.isArray(params.id)) {
      const segmentLength = 60;
      const ids = params.id;

      for (let index = 0; index < params.id.length / segmentLength; index++) {
        const start = index * segmentLength;
        const optionsCopy = Object.assign({}, options);
        optionsCopy.params.id = ids.slice(start, start + segmentLength);

        futures.push(
          this.$http.get(url, optionsCopy).then(response => response.data)
        );
      }
    } else {
      futures.push(
        this.$http.get(url, options).then(response => response.data)
      );
    }

    return this.$q.all(futures).then(entities => {
      const result = [];
      entities.forEach(array => result.push.apply(result, array));
      return result;
    });
  }

  getTransactionData(itemService, token, query) {
    return this.search(token, query).then((searchResult) => {
      const transactionIdsSet = new Set();
      searchResult.entity.map(transaction => transactionIdsSet.add(transaction.id));
      const transactionIds = Array.from(transactionIdsSet);

      const itemIdsSet = new Set();
      searchResult.entity.forEach(transaction => itemIdsSet.add(transaction.itemId));
      const itemIds = Array.from(itemIdsSet);

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

        const transactionData = transactions.map(transaction => {
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

  /*
    Given an array of transactions, return an array of transactions such that
    `transaction.user_id`s are preserved and the resulting array is minimal in length
  */
  getMinimalUserIdCovering(transactions) {
    const result = [];
    const userIds = new Set();

    for (let transaction of transactions) {
      if (transaction.user_id !== null && !userIds.has(transaction.user_id)) {
        userIds.add(transaction.user_id);
        result.push(transaction);
      }
    }

    return result;
  }
}

TransactionService.$inject = ['$q', '$http', 'Transaction', 'settings', 'ToolsService', 'RelationalService', 'SearchEntity'];