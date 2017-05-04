export default class MyTransactionController {
  constructor(
    $window,
    $q,
    $scope,
    $state,
    $mdDialog,
    Paging,
    storageService,
    itemService,
    transactionService,
    toolsService,
    uiService,
    Page
  ) {
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.Paging = Paging;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.toolsService = toolsService;
    this.uiService = uiService;
    this.Page = Page;

    this.$scope.$parent.showTabs = false;

    this.storage = storageService.read();
    this.selected = [];
    this.pagingService = new this.Paging(
      (data) => this.$q.resolve(data.count),
      (limit, offset) => {
        const query = this.toolsService.stateParamsToQuery(this.$state.params);
        this.toolsService.maintainKeys(query, ['user_id', 'limit', 'offset', 'order']);

        query.status = transactionService.getUsedForCountingStatuses();
        query.limit = 100;
        query.leaf = true;
        query.order = '-timeCreated';
        query.user_id = this.$state.params.user_id;

        return this.transactionService.getTransactionData(this.itemService, this.storage.auth.idToken, query);
      }
    );

    this.run();
  }

  run() {
    this.$scope.uiReady = false;
    this.$scope.paging = new this.Page();
    this.$scope.paging.data = {entity: []};

    this.$scope.$parent.ready.then((resolve) => {
      this.loadPage(
        this.$window.parseInt(this.$state.params.page),
        this.$window.parseInt(this.$state.params.pageSize)
      ).finally(() => {
        this.$scope.uiReady = true;
      });
    });

    this.$scope.$on('downstream.transaction.created', () => {
      this.loadPage(
        this.$window.parseInt(this.$state.params.page),
        this.$window.parseInt(this.$state.params.pageSize)
      );
    });
  }

  loadPage(page, pageSize) {
    return this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }, () => {
      this.uiService.notify('Unable to retrieve transactions');
    });
  }

  readTransaction(transaction, user, item) {
    this.$mdDialog.show({
      controller: ['$window', '$scope', 'transaction', 'user', 'item', function($window, $scope, transaction, user) {
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

  viewItem(item) {
    this.$mdDialog.show({
      controller: ['$window', '$scope', '$sanitize', 'item',  function($window, $scope, $sanitize, item) {
        $scope.time = new $window.Date();
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

  showQRCode(transaction) {
    this.$mdDialog.show({
      controller: ['$scope', 'settings', 'transaction', function($scope, settings, transaction) {
        $scope.settings = settings;
        $scope.transaction = transaction;

$scope.transaction.id = '5824973124aa9a004b2ee6aa';
        /*
5824973124aa9a004b2ee6aa
5802a70d24aa9a004bc5f1af
        */
      }],
      templateUrl: '/src/transaction/partial/qr.html',
      clickOutsideToClose: true,
      locals: {
        transaction: transaction
      }
    });
  }
}

MyTransactionController.$inject = [
  '$window',
  '$q',
  '$scope',
  '$state',
  '$mdDialog',
  'Paging',
  'StorageService',
  'ItemService',
  'TransactionService',
  'ToolsService',
  'UIService',
  'Page'
];