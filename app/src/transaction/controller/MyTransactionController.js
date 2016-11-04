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
    itemTransactionService,
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
    this.itemTransactionService = itemTransactionService;
    this.toolsService = toolsService;
    this.uiService = uiService;
    this.Page = Page;

    this.$scope.$parent.showTabs = false;

    this.storage = storageService.read();
    this.selected = [];
    this.pagingService = new this.Paging((data) => {
      return this.$q.resolve(data.count);
    }, (limit, offset) => {
      const query = this.toolsService.stateParamsToQuery(this.$state.params);

      delete query.pageSize;
      delete query.page;

      query.limit = limit;
      query.offset = offset;
      query.leaf = true;

      query.user_id = this.$state.params.user_id;

      this.toolsService.maintainKeys(query, ['user_id', 'limit', 'offset', 'order']);

      return this.itemTransactionService.getTransactionData(this.itemService, this.storage.token, query);
    });

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

    this.$scope.$on('SSE.TRANSACTION.CREATED', () => {
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
  'ItemTransactionService',
  'ToolsService',
  'UIService',
  'Page'
];