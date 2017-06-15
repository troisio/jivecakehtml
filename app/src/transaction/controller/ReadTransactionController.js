export default class ReadTransactionController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    storageService,
    itemService,
    organizationService,
    transactionService,
    userService,
    uiService,
    db
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.itemService = itemService;
    this.organizationService = organizationService;
    this.transactionService = transactionService;
    this.userService = userService;
    this.uiService = uiService;
    this.db = db;

    $scope.selected = [];
    $scope.searchText = '';
    this.$scope.data = [];

    $scope.$parent.selectedTab = 3;
    this.run();
  }

  run() {
    this.$scope.loading = true;

    this.$scope.data = [];

    this.$scope.$parent.ready.then(() => {
      return this.getWhere().then(loveFieldQuery => {

        const storage = this.storageService.read();
        return this.userService.refreshUserCacheFromTransactions(storage.auth.idToken, loveFieldQuery).then(() => {
          const transactionTable = this.db.getSchema().table('Transaction');
          const userTable = this.db.getSchema().table('User');
          const itemTable = this.db.getSchema().table('Item');

          const columns = [];

          [transactionTable, userTable, itemTable].forEach(table => {
            table.getColumns()
              .map(column => table[column.getName()])
              .forEach(column => columns.push(column));
          });

          return this.db.select(...columns)
            .from(transactionTable)
            .innerJoin(itemTable, itemTable.id.eq(transactionTable.itemId))
            .leftOuterJoin(userTable, userTable.user_id.eq(transactionTable.user_id))
            .where(loveFieldQuery)
            .orderBy(transactionTable.timeCreated, lf.Order.DESC)
            .exec()
            .then(rows => {
              this.$scope.data = rows;
            });
        });
      });
    }, () => {
      this.uiService.notify('Unable to retrieve data');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }

  getWhere() {
    const permissionTable = this.db.getSchema().table('Permission');

    return this.db.select()
      .from(permissionTable)
      .where(permissionTable.objectClass.eq('Organization'))
      .exec()
      .then(rows => {
        const transactionTable = this.db.getSchema().table('Transaction');

        const ands = [
          transactionTable.leaf.eq(true)
        ];

        let hasFilter = false;

        ['eventId', 'itemId', 'id'].forEach(filter => {
          if (typeof this.$state.params[filter] !== 'undefined') {
            const value = this.$state.params[filter];
            if (Array.isArray(value)) {
              ands.push(transactionTable[filter].in(value));
            } else {
              ands.push(transactionTable[filter].eq(value));
            }
            hasFilter = true;
          }
        });

        if (!hasFilter) {
          const organizationIds = rows.map(permission => permission.objectId);
          ands.push(
            transactionTable.organizationId.in(organizationIds)
          );
        }

        return lf.op.and(...ands);
      });
  }

  textChange(text) {
    this.$scope.loading = true;

    this.$scope.$parent.ready.then(() => {
      return this.getWhere().then((query) => {

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

    if (transactionData.Transaction.status === 2) {
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
      const storage = this.storageService.read();
      this.transactionService.delete(storage.auth.idToken, transactionData.Transaction.id).then(() => {
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
      const storage = this.storageService.read();
      this.transactionService.revoke(storage.auth.idToken, transaction.id).then((profile) => {
        this.run();
        this.uiService.notify('Transaction revoked');
      }, (response) => {
        this.uiService.notify('Unable to revoke transaction');
      });
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
  'UserService',
  'UIService',
  'db'
];