export default class MyTransactionController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    storageService,
    itemService,
    transactionService,
    uiService
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.uiService = uiService;

    this.$scope.$parent.showTabs = false;
    this.$scope.uiReady = false;
    this.selected = [];

    [
      'transaction.create',
      'transaction.update',
      'transaction.revoke',
      'transaction.delete'
    ].forEach(event => {
      $scope.$on(event, () => {
        this.run();
      });
    });

    this.run();
  }

  run() {
    this.$scope.uiReady = false;
    const storage = this.storageService.read();

    this.$scope.$parent.ready.then(() => {
      this.transactionService.getTransactionData(this.itemService, storage.auth.idToken, {
        status: [this.transactionService.SETTLED, this.transactionService.PENDING],
        limit: 100,
        leaf: true,
        order: '-timeCreated',
        user_id: this.$state.params.user_id
      }).then((data) => {
        this.$scope.data = data.entity;
        this.$scope.uiReady = true;
      }, () => {
        this.$scope.uiReady = true;
        this.uiService.notify('Unable to retrieve transactions');
      });
    });
  }

  readTransaction(transaction, item) {
    const storage = this.storageService.read();

    this.$mdDialog.show({
      controller: 'ViewTransactionController',
      controllerAs: 'controller',
      templateUrl: '/src/transaction/partial/view.html',
      clickOutsideToClose: true,
      locals: {
        transaction: transaction,
        item: item,
        user: storage.profile
      }
    });
  }

  viewItem(item) {
    this.$mdDialog.show({
      controller: ['$scope', '$sanitize', 'item',  function($scope, $sanitize, item) {
        $scope.time = new Date();
        $scope.item = item;
        $scope.$sanitize = $sanitize;
      }],
      templateUrl: '/src/public/partial/viewItem.html',
      clickOutsideToClose: true,
      locals: {
        item: item
      }
    });
  }
}

MyTransactionController.$inject = [
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'ItemService',
  'TransactionService',
  'UIService'
];