export default class ReadItemTransactionController {
  constructor(
    $window,
    $scope,
    $state,
    $mdDialog,
    storageService,
    itemService,
    itemTransactionService,
    toolsService,
    uiService,
    TransactionLoader
  ) {
    this.$window = $window;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.itemService = itemService;
    this.itemTransactionService = itemTransactionService;
    this.toolsService = toolsService;
    this.uiService = uiService;

    $scope.selected = [];
    $scope.searchText = '';

    this.storage = storageService.read();
    $scope.$parent.selectedTab = 3;

    this.loader = new TransactionLoader($window, this.itemService, itemTransactionService, this.storage.token, 50);
    this.loader.query = this.getQuery();

    $scope.loader = this.loader;
    this.run();
  }

  run() {
    this.$scope.$parent.ready.then((resolve) => {
      this.loader.loadPage(0);
    });
  }

  transferTransaction(transaction) {
    this.$mdDialog.show({
      controller: 'TransferPassController',
      controllerAs: 'controller',
      templateUrl: '/src/transaction/partial/transferTransaction.html',
      clickOutsideToClose: true,
      locals: {
        transaction: transaction
      }
    });
  }

  readTransaction(transaction, user, item) {
    this.$mdDialog.show({
      controller: ['$window', '$scope', 'transaction', 'user', 'item', function($window, $scope, transaction, user, item) {
        $scope.transaction = transaction;
        $scope.user = user;
        $scope.item = item;
        $scope.time = new $window.Date();
      }],
      controllerAs: 'controller',
      templateUrl: '/src/transaction/partial/view.html',
      clickOutsideToClose: true,
      locals: {
        transaction: transaction,
        user: user,
        item: item
      }
    });
  }

  deleteTransaction(transaction, $event) {
    const message = transaction.status === 5 ? 'Are you sure you want to undo this revocation?' : 'Are you sure you want to delete this transaction?' ;
    const confirm = this.$mdDialog.confirm()
          .title(message)
          .ariaLabel('Delete Transaction')
          .clickOutsideToClose(true)
          .targetEvent($event)
          .ok('DELETE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.itemTransactionService.delete(this.storage.token, transaction.id).then((profile) => {
        this.reload();
        this.uiService.notify('Transaction deleted');
      }, (response) => {
        this.uiService.notify('Unable to delete transaction');
      });
    });
  }

  revokeTransaction(transaction, $event) {
    const confirm = this.$mdDialog.confirm()
          .title('Are you sure you want to revoke this transaction?')
          .ariaLabel('Revoke Transaction')
          .clickOutsideToClose(true)
          .targetEvent($event)
          .ok('REVOKE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.itemTransactionService.revoke(this.storage.token, transaction.id).then((profile) => {
        this.reload();
        this.uiService.notify('Transaction revoked');
      }, (response) => {
        this.uiService.notify('Unable to revoke transaction');
      });
    });
  }

  reload() {
    const query = this.getQuery();
    this.loader.reset();
    this.loader.query = query;
    this.loader.loadPage(0);
  }

  getQuery() {
    const query = {
      order: '-timeCreated',
    };
    const stateParams = this.toolsService.stateParamsToQuery(this.$state.params);

    if (this.$scope.searchText.length > 0) {
      query.text = this.$scope.searchText;
    }

    for (let key in stateParams) {
      query[key] = stateParams[key];
    }

    return query;
  }
}

ReadItemTransactionController.$inject = [
  '$window',
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'ItemService',
  'ItemTransactionService',
  'ToolsService',
  'UIService',
  'TransactionLoader'
];