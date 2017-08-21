import angular from 'angular';

export default class CreateTransactionController {
  constructor(
    $q,
    $scope,
    $state,
    auth0Service,
    $stateParams,
    Transaction,
    itemService,
    eventService,
    transactionService,
    storageService,
    uiService,
    userService
  ) {
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.auth0Service = auth0Service;
    this.$stateParams = $stateParams;
    this.Transaction = Transaction;
    this.itemService = itemService;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.storageService = storageService;
    this.uiService = uiService;

    $scope.userService = userService;

    const storage = storageService.read();
    this.itemFuture = this.itemService.read(storage.auth.idToken, this.$stateParams.itemId);

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.itemFuture.then(() => {
      return this.setDefaults();
    }, () => {
      this.uiService.notify('Unable to find item');
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  setDefaults() {
    const storage = this.storageService.read();

    this.$scope.form.$setUntouched();
    this.$scope.form.$setPristine();

    this.$scope.selected = '';
    this.$scope.text = '';

    this.$scope.transaction = new this.Transaction();
    this.$scope.transaction.quantity = 1;

    return this.itemFuture.then((item) => {
      this.$scope.item = item;

      const eventFuture = this.eventService.read(storage.auth.idToken, item.eventId).then(event => {
        this.$scope.transaction.currency = event.currency;
        this.$scope.event = event;
      });

      const derivedAmountFuture = this.itemService.getDerivedAmount(item, this.transactionService).then(amount => {
        this.$scope.transaction.amount = amount === null ? 0 : amount;
      });

      return this.$q.all([eventFuture, derivedAmountFuture]);
    });
  }

  query(search) {
    const storage = this.storageService.read();

    const terms = search.split(new RegExp('\\s+', 'g')).join(' ');
    const queryParts = [
      'user_metadata.given_name',
      'user_metadata.family_name',
      'family_name',
      'given_name',
      'email',
      'name'
    ].map(field => field + ':' + terms + '*');

    let query = queryParts.join(' OR ');

    return this.auth0Service.searchUsers(storage.auth.idToken, {
      q: query,
      search_engine: 'v2'
    });
  }

  select(user) {
    if (user === null || typeof user === 'undefined') {
      this.$scope.transaction.user_id = null;
    } else {
      this.$scope.transaction.user_id = user.user_id;
    }
  }

  submit(transaction, item, selectedUser, event) {
    const storage = this.storageService.read();

    this.$scope.loading = true;
    const transactionCopy = angular.copy(transaction);

    this.transactionService.search(storage.auth.idToken, {
      itemId: item.id
    }).then(() => {
      if (selectedUser !== null) {
        transactionCopy.user_id = selectedUser.user_id;
        transactionCopy.given_name = null;
        transactionCopy.middleName = null;
        transactionCopy.family_name = null;
        transactionCopy.email = null;
      }

      if (event.currency !== null) {
        transactionCopy.currency = event.currency;
      }

      return this.transactionService.create(storage.auth.idToken, item.id, transactionCopy).then(() => {
        this.uiService.notify('Transaction created');

        window.scrollTo(0, 0);
        return this.setDefaults();
      }, response => {
        let message = 'Unable to create transaction';

        if (response.status === 400 && 'data' in response) {
          if (response.data.error === 'totalAvailible') {
            message = 'Can not create more than ' + response.data.data + ' transactions';
          }
        }

        this.uiService.notify(message);
      });
    }, () => {
      this.uiService.notify('Unable to read transaction for ' + item.name);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateTransactionController.$inject = [
  '$q',
  '$scope',
  '$state',
  'Auth0Service',
  '$stateParams',
  'Transaction',
  'ItemService',
  'EventService',
  'TransactionService',
  'StorageService',
  'UIService',
  'UserService'
];