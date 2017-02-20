export default class ReadTransactionController {
  constructor(
    $window,
    $scope,
    $state,
    $mdDialog,
    storageService,
    itemService,
    transactionService,
    toolsService,
    uiService,
    TransactionLoader
  ) {
    this.$window = $window;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.toolsService = toolsService;
    this.uiService = uiService;

    $scope.selected = [];
    $scope.searchText = '';

    this.storage = storageService.read();
    $scope.$parent.selectedTab = 3;

    this.loader = new TransactionLoader($window, this.itemService, transactionService, this.storage.auth.idToken, 100);
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
    let confirm;

    if (transaction.status === 5) {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to undo this revocation?')
        .ariaLabel('Revoke Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('UNDO')
        .cancel('Cancel');
    } else {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to delete this revocation?')
        .ariaLabel('Delete Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('DELETE')
        .cancel('Cancel');
    }

    this.$mdDialog.show(confirm).then(() => {
      this.transactionService.delete(this.storage.auth.idToken, transaction.id).then((profile) => {
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
      this.transactionService.revoke(this.storage.auth.idToken, transaction.id).then((profile) => {
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
      leaf: 'true'
    };
    const stateParams = this.toolsService.stateParamsToQuery(this.$state.params);

    if (this.$scope.searchText.length > 0) {
      query.text = this.$scope.searchText;
    }

    this.$window.Object.assign(query, stateParams);
    return query;
  }
}

ReadTransactionController.$inject = [
  '$window',
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'ItemService',
  'TransactionService',
  'ToolsService',
  'UIService',
  'TransactionLoader'
];