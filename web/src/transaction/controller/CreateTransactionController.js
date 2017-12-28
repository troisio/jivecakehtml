import angular from 'angular';
import TransactionService from '../../service/TransactionService';

export default class CreateTransactionController {
  constructor(
    $q,
    $scope,
    $state,
    $timeout,
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
    this.$timeout = $timeout;
    this.Transaction = Transaction;
    this.itemService = itemService;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.storageService = storageService;
    this.uiService = uiService;

    $scope.userService = userService;
    $scope.currencies = TransactionService.getSupportedCurrencies();

    const storage = storageService.read();
    this.itemFuture = this.itemService.read(storage.auth.idToken, this.$state.params.itemId);

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.itemFuture.then(() => {
      return this.setDefaults();
    }, () => {
      this.uiService.notify('Unable to find item');
    }).then(() => {}, () => {})
      .then(() => {
      this.$scope.uiReady = true;
      this.$timeout();
    });
  }

  setDefaults() {
    const storage = this.storageService.read();

    this.$scope.form.$setUntouched();
    this.$scope.form.$setPristine();

    this.$scope.selected = '';

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

  submit(transaction, item, event) {
    const storage = this.storageService.read();

    this.$scope.loading = true;
    const transactionCopy = angular.copy(transaction);

    if (event.currency !== null) {
      transactionCopy.currency = event.currency;
    }

    return this.transactionService.create(storage.auth.idToken, item.id, transactionCopy).then(() => {
      this.uiService.notify('Transaction created');
      return this.setDefaults();
    }, response => {
      let message = 'Unable to create transaction';

      if (response.status === 400 && 'data' in response) {
        if (response.data.error === 'totalAvailible') {
          message = 'Can not create more than ' + response.data.data + ' transactions';
        }
      }

      this.uiService.notify(message);
    }).then(() => {}, () => {})
      .then(() => {
        this.$scope.loading = false;
        this.$timeout();
      });
  }
}

CreateTransactionController.$inject = [
  '$q',
  '$scope',
  '$state',
  '$timeout',
  'Transaction',
  'ItemService',
  'EventService',
  'TransactionService',
  'StorageService',
  'UIService',
  'UserService'
];