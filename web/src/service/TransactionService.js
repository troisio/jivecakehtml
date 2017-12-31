export default class TransactionService {
  constructor($q, $http, Organization, Item, Event, Transaction, settings, toolsService, relationalService, SearchEntity) {
    this.$q = $q;
    this.$http = $http;
    this.Organization = Organization;
    this.Item = Item;
    this.Event = Event;
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

  getOrganization(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/transaction/${id}/organization`;
    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response))
    .then(json => this.toolsService.toObject(json, this.Organization));
  }

  getEvent(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/transaction/${id}/event`;
    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response))
    .then(json => this.toolsService.toObject(json, this.Event));
  }

  getItem(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/transaction/${id}/item`;
    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response))
    .then(json => this.toolsService.toObject(json, this.Item));
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

  static getSupportedCurrencies() {
    return [
      {
        id: 'AUD',
        label: 'Australian Dollar',
        symbol: '$'
      },
      {
        id: 'BBD',
        label: 'Barbadian dollar',
        symbol: 'Bds$'
      },
      {
        id: 'BRL',
        label: 'Brazilian Real',
        symbol: 'R$'
      },
      {
        id: 'BSD',
        label: 'Bahamian dollar',
        symbol: '$'
      },
      {
        id: 'CAD',
        label: 'Canadian Dollar',
        symbol: '$'
      },
      {
        id: 'EUR',
        label: 'Euro',
        symbol: '€'
      },
      {
        id: 'FJD',
        label: 'Fijian Dollar',
        symbol: 'FJ$'
      },
      {
        id: 'GBP',
        label: 'Pound Sterling',
        symbol: '£'
      },
      {
        id: 'ILS',
        label: 'Israeli Shekel',
        symbol: '₪',
        html: '&#8362;'
      },
      {
        id: 'ISK',
        label: 'Icelandic Krona',
        symbol: 'kr'
      },
      {
        id: 'NZD',
        label: 'New Zealand Dollar',
        symbol: '$'
      },
      {
        id: 'RUB',
        label: 'Russian Ruble',
        symbol: '₽',
        html: '&#x20bd;'
      },
      {
        id: 'SEK',
        label: 'Swedish Kronner',
        symbol: 'kr'
      },
      {
        id: 'TTD',
        label: 'Trinidad and Tobago Dollar',
        symbol: '$'
      },
      {
        id: 'USD',
        label: 'US Dollar',
        symbol: '$'
      },
      {
        id: 'ZAR',
        label: 'South African Rand',
        symbol: 'R'
      }
    ];
  }
}

TransactionService.$inject = ['$q', '$http', 'Organization', 'Item', 'Event', 'Transaction', 'settings', 'ToolsService', 'RelationalService', 'SearchEntity'];