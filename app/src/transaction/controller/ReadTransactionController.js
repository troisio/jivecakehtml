export default class ReadTransactionController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    storageService,
    itemService,
    organizationService,
    transactionService,
    uiService,
    db
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.itemService = itemService;
    this.organizationService = organizationService;
    this.transactionService = transactionService;
    this.uiService = uiService;
    this.db = db;

    $scope.selected = [];
    $scope.searchText = '';
    this.$scope.data = [];

    this.storage = storageService.read();
    $scope.$parent.selectedTab = 3;
    this.run();
  }

  run() {
    this.$scope.loading = true;

    this.$scope.$parent.ready.then((resolve) => {
      return this.getQuery().then((query) => {
        return this.transactionService.getTransactionData(this.itemService, this.storage.auth.idToken, query).then(result => {
          this.$scope.data = result.entity;
        });
      });
    }, () => {
      this.uiService.notify('Unable to retrieve data');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }

  textChange(text) {
    this.$scope.loading = true;

    this.$scope.$parent.ready.then((resolve) => {
      return this.getQuery().then((query) => {
        query.text = text;

        return this.transactionService.getTransactionData(this.itemService, this.storage.auth.idToken, query).then((result) => {
          this.$scope.data = result.entity;
        });
      });
    }, () => {
      this.uiService.notify('Unable to retrieve data');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }

  readTransaction(transaction, user, item) {
    this.$mdDialog.show({
      controller: ['$scope', 'transaction', 'user', 'item', function($scope, transaction, user, item) {
        $scope.transaction = transaction;
        $scope.user = user;
        $scope.item = item;
        $scope.time = new Date();
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

  deleteTransaction(transactionData, $event) {
    let confirm;

    if (transactionData.transaction.status === 2) {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to undo this revocation?')
        .ariaLabel('Revoke Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('UNDO')
        .cancel('Cancel');
    } else {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to delete this?')
        .ariaLabel('Delete Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('DELETE')
        .cancel('Cancel');
    }

    this.$mdDialog.show(confirm).then(() => {
      this.transactionService.delete(this.storage.auth.idToken, transactionData.transaction.id).then(() => {
        this.run();
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
        this.run();
        this.uiService.notify('Transaction revoked');
      }, (response) => {
        this.uiService.notify('Unable to revoke transaction');
      });
    });
  }

  getQuery() {
    const permissionTable = this.db.getSchema().table('Permission');

    return this.db.select()
      .from(permissionTable)
      .where(permissionTable.objectClass.eq('Organization'))
      .exec()
      .then(rows => {
        const organizationIds = rows.map(permission => permission.objectId);

        const query = {
          order: '-timeCreated',
          leaf: true
        };

        let hasFilter = false;

        ['eventId', 'itemId', 'id'].forEach((filter) => {
          if (typeof this.$state.params[filter] !== 'undefined') {
            query[filter] = this.$state.params[filter];
            hasFilter = true;
          }
        });

        if (!hasFilter) {
          query.organizationId = organizationIds;
          query.limit = 100;
        }

        return query;
      });
  }
}

ReadTransactionController.$inject = [
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'ItemService',
  'OrganizationService',
  'TransactionService',
  'UIService',
  'db'
];