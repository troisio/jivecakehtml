export default class ReadItemTransactionController {
  constructor(
    $window,
    $q,
    $scope,
    $stateParams,
    $mdDialog,
    Paging,
    auth0Service,
    storageService,
    itemService,
    featureService,
    organizationService,
    relationalService,
    itemTransactionService,
    toolsService,
    uiService,
    Page
  ) {
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.$stateParams = $stateParams;
    this.$mdDialog = $mdDialog;
    this.Paging = Paging;
    this.auth0Service = auth0Service;
    this.itemService = itemService;
    this.featureService = featureService;
    this.organizationService = organizationService;
    this.relationalService = relationalService;
    this.itemTransactionService = itemTransactionService;
    this.toolsService = toolsService;
    this.uiService = uiService;
    this.Page = Page;

    this.selected = [];
    this.readOrganizationIds = [];
    this.searchText = '';

    this.storage = storageService.read();
    this.pagingService = new this.Paging((data) => {
      return this.$q.resolve(data.count);
    }, (limit, offset) => {
      const query = this.toolsService.stateParamsToQuery($stateParams);

      delete query.page;
      delete query.pageSize;

      query.limit = limit;
      query.offset = offset;

      if (!('order' in query)) {
        query.order = '-timeCreated';
      }

      if (this.searchText.length > 0) {
        query.text = this.searchText;
      }

      return this.itemTransactionService.getTransactionData(this.itemService, this.storage.token, query);
    });

    this.$scope.$parent.selectedTab = 3;
    this.$scope.paging = new this.Page();
    this.$scope.paging.data = {entity: []};
    this.$scope.query = {
      limit: this.$window.parseInt(this.$stateParams.pageSize),
      page: this.$window.parseInt(this.$stateParams.page) + 1
    };

    this.$scope.paginate = () => {
      this.loadPage(this.$scope.query.page - 1, this.$scope.query.limit);
    };

    this.run();
  }

  run() {
    ['ITEM.TRANSACTION.CREATED'].forEach((event) => {
      this.$scope.$on(event, () => {
        this.loadPage(
          this.$window.parseInt(this.$scope.paging.page),
          this.$window.parseInt(this.$scope.paging.pageSize)
        );
      });
    });

    this.$scope.$parent.ready.then((resolve) => {
      this.readOrganizationIds = resolve.permission.entity.filter((permission) => {
        return permission.objectClass === this.organizationService.getObjectClassName() &&
               permission.has(this.organizationService.getReadPermission());
      }).map(function(permission){
        return permission.objectId;
      });

      this.loadPage(
        this.$window.parseInt(this.$stateParams.page),
        this.$window.parseInt(this.$stateParams.pageSize)
      );

      this.$scope.$on('ITEM.TRANSACTION.SEARCH', (event, query) => {
        this.$scope.loading = true;

        query.organizationId = this.readOrganizationIds;

        this.itemTransactionService.search(this.storage.token, query).then((data) => {
          const paging = new this.Page();
          paging.data = data;
          paging.total = data.count;
          paging.pageCount = 1;
          paging.pageSize = data.entity.length;

          this.$scope.paging = paging;
        }).finally(() => {
          this.$scope.loading = false;
        });
      });
    });
  }

  openSearch() {
    this.$mdDialog.show({
      controller: 'SearchItemTransactionController',
      templateUrl: '/src/transaction/partial/searchItemTransaction.html',
      clickOutsideToClose: true
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
    const confirm = this.$mdDialog.confirm()
          .title('Are you sure you want to delete this transaction?')
          .ariaLabel('Delete Transaction')
          .targetEvent($event)
          .ok('DELETE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.itemTransactionService.delete(this.storage.token, transaction.id).then((profile) => {
        this.loadPage(
          this.$window.parseInt(this.$stateParams.page),
          this.$window.parseInt(this.$stateParams.pageSize)
        );
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
          .targetEvent($event)
          .ok('REVOKE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.itemTransactionService.revoke(this.storage.token, transaction.id).then((profile) => {
        this.loadPage(
          this.$window.parseInt(this.$stateParams.page),
          this.$window.parseInt(this.$stateParams.pageSize)
        );
        this.uiService.notify('Transaction revoked');
      }, (response) => {
        this.uiService.notify('Unable to revoke transaction');
      });
    });
  }

  onSearchTextChanged() {
    this.loadPage(
      this.$window.parseInt(this.$scope.paging.page),
      this.$window.parseInt(this.$scope.paging.pageSize)
    );
  }

  loadPage(page, pageSize) {
    this.$scope.uiReady = false;

    return this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }
}

ReadItemTransactionController.$inject = [
  '$window',
  '$q',
  '$scope',
  '$stateParams',
  '$mdDialog',
  'Paging',
  'Auth0Service',
  'StorageService',
  'ItemService',
  'FeatureService',
  'OrganizationService',
  'RelationalService',
  'ItemTransactionService',
  'ToolsService',
  'UIService',
  'Page'
];