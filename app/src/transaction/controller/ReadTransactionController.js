export default class ReadTransactionController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    storageService,
    transactionService,
    userService,
    uiService,
    db
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.transactionService = transactionService;
    this.userService = userService;
    this.uiService = uiService;
    this.db = db;

    $scope.selected = [];
    $scope.searchText = '';
    this.$scope.data = [];

    $scope.$parent.selectedTab = 3;

    [
      'transaction.create',
      'transaction.revoke',
      'transaction.delete'
    ].forEach(event => {
      $scope.$on(event, () => {
        this.run();
      });
    });

    this.selectColumns = [];

    this.permissionTable = this.db.getSchema().table('Permission');
    this.transactionTable = this.db.getSchema().table('Transaction');
    this.userTable = this.db.getSchema().table('User');
    this.itemTable = this.db.getSchema().table('Item');

    [this.transactionTable, this.userTable, this.itemTable].forEach(table => {
      table.getColumns()
        .map(column => table[column.getName()])
        .forEach(column => this.selectColumns.push(column));
    });

    this.run();
  }

  run() {
    this.$scope.loading = true;

    this.$scope.data = [];

    this.$scope.$parent.ready.then(() => {
      return this.getWhereClause(this.$scope.searchText).then(whereClause => {
        const storage = this.storageService.read();
        return this.userService.refreshUserCacheFromTransactions(storage.auth.idToken, whereClause).then(() => {
          return this.getRows(whereClause)
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

  getRows(whereClause) {
    return this.db.select(...this.selectColumns)
      .from(this.transactionTable)
      .innerJoin(this.itemTable, this.itemTable.id.eq(this.transactionTable.itemId))
      .leftOuterJoin(this.userTable, this.userTable.user_id.eq(this.transactionTable.user_id))
      .where(whereClause)
      .limit(100)
      .orderBy(this.transactionTable.timeCreated, lf.Order.DESC)
      .exec();
  }

  getWhereClause(text) {
    return this.db.select()
      .from(this.permissionTable)
      .where(this.permissionTable.objectClass.eq('Organization'))
      .exec()
      .then(rows => {
        const ands = [
          this.transactionTable.leaf.eq(true)
        ];

        let hasFilter = false;

        ['eventId', 'itemId', 'id'].forEach(filter => {
          const value = this.$state.params[filter];

          if (typeof value !== 'undefined') {
            if (Array.isArray(value)) {
              ands.push(this.transactionTable[filter].in(value));
            } else {
              ands.push(this.transactionTable[filter].eq(value));
            }
            hasFilter = true;
          }
        });

        if (typeof text !== 'undefined' && text.length > 0) {
          const escapedPattern= text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(escapedPattern, 'i');
          ands.push(
            lf.op.or(
              this.transactionTable.family_name.match(regex),
              this.transactionTable.middleName.match(regex),
              this.transactionTable.given_name.match(regex),
              this.transactionTable.email.match(regex),
              this.itemTable.name.match(regex),
              this.userTable.given_name.match(regex),
              this.userTable.family_name.match(regex),
              this.userTable.email.match(regex),
              this.userTable.name.match(regex),
              this.userTable.nickname.match(regex)
            )
          );
        }

        if (!hasFilter) {
          const organizationIds = rows.map(permission => permission.objectId);
          ands.push(
            this.transactionTable.organizationId.in(organizationIds)
          );
        }

        return lf.op.and(...ands);
      });
  }

  onSearchTextChange(text) {
    this.$scope.loading = true;

    this.$scope.$parent.ready.then(() => {
      return this.getWhereClause(text).then((whereClause) => {
        return this.getRows(whereClause)
          .then(rows => {
            this.$scope.data = rows;
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
      this.transactionService.revoke(storage.auth.idToken, transaction.id).then(() => {
        this.uiService.notify('Transaction revoked');
      }, () => {
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
  'TransactionService',
  'UserService',
  'UIService',
  'db'
];