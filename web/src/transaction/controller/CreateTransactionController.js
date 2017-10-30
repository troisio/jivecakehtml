import angular from 'angular';
import TransactionService from '../../service/TransactionService';

export default class CreateTransactionController {
  constructor(
    $q,
    $scope,
    $state,
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
    this.$stateParams = $stateParams;
    this.Transaction = Transaction;
    this.itemService = itemService;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.storageService = storageService;
    this.uiService = uiService;

    $scope.userService = userService;
    $scope.currencies = TransactionService.getSupportedCurrencies();

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

    this.transactionService.search(storage.auth.idToken, {
      itemId: item.id
    }).then(() => {
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
  '$stateParams',
  'Transaction',
  'ItemService',
  'EventService',
  'TransactionService',
  'StorageService',
  'UIService',
  'UserService'
];