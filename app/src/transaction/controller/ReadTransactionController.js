import lf from 'lovefield';

export default class ReadTransactionController {
  constructor(
    $scope,
    $q,
    $state,
    $mdDialog,
    storageService,
    transactionService,
    paypalService,
    stripeService,
    userService,
    uiService,
    toolsService,
    db,
    Transaction
  ) {
    this.$scope = $scope;
    this.$q = $q;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.transactionService = transactionService;
    this.paypalService = paypalService;
    this.stripeService = stripeService;
    this.userService = userService;
    this.uiService = uiService;
    this.toolsService = toolsService;
    this.db = db;
    this.Transaction = Transaction;

    $scope.selected = [];
    $scope.searchText = '';
    this.$scope.data = [];

    $scope.$parent.selectedTab = 3;

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

    const isVendorTransaction = new Transaction().isVendorTransaction;

    $scope.isVendorTransaction = function(transaction) {
      return isVendorTransaction.call(transaction);
    };

    this.selectColumns = [];

    this.permissionTable = this.db.getSchema().table('Permission');
    this.transactionTable = this.db.getSchema().table('Transaction');
    this.userTable = this.db.getSchema().table('User');
    this.itemTable = this.db.getSchema().table('Item');
    this.assetTable = this.db.getSchema().table('EntityAsset');

    [this.transactionTable, this.itemTable, this.assetTable, this.userTable].forEach(table => {
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
          return this.getRows(whereClause).then(data => {
            const rows = data.map(datum => Object.assign({}, datum));

            for (let row of rows) {
              row.Transaction = this.toolsService.toObject(row.Transaction, this.Transaction);
            }

            this.$scope.data = rows;
          });
        });
      }).then(() => {
        this.$scope.loading = false;
      }, () => {
        this.uiService.notify('Unable to retrieve data');
        this.$scope.loading = false;
      }).then(() => {
        this.$scope.$apply();
      })
    });
  }

  getRows(whereClause) {
    return this.db.select(...this.selectColumns)
      .from(this.transactionTable)
      .innerJoin(this.itemTable, this.itemTable.id.eq(this.transactionTable.itemId))
      .leftOuterJoin(this.userTable, this.userTable.user_id.eq(this.transactionTable.user_id))
      .leftOuterJoin(this.assetTable, this.assetTable.entityId.eq(this.transactionTable.user_id))
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
          const escapedPattern= text.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
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

  showImage(src) {
    this.$mdDialog.show({
      controller: ['$scope', function($scope) {
        $scope.src = src;
      }],
      template: '<md-dialog class="profile-picture" aria-label="profile-picture"><md-dialog-content><div layout-padding class="img-preview"><img ng-src="{{src}}"></div></md-dialog-content></md-dialog>',
      clickOutsideToClose: true
    });
  }

  refund(transaction, $event) {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure you refund this transaction?')
      .ariaLabel('Refund Transaction')
      .clickOutsideToClose(true)
      .targetEvent($event)
      .ok('Yes')
      .cancel('Cancel');

      this.$mdDialog.show(confirm).then(() => {
        const storage = this.storageService.read();

        const promise = this.uiService.load();
        let future;

        if (transaction.linkedObjectClass === 'PaypalPayment') {
          future = this.paypalService.refund(storage.auth.idToken, transaction.id).then(() => {
            this.uiService.notify('Transaction refunded');
          }, () => {
            this.uiService.notify('Unable to refund');
          });
        } else if (transaction.linkedObjectClass === 'StripeCharge') {
          future = this.stripeService.refund(storage.auth.idToken, transaction.id).then(() => {
            this.uiService.notify('Transaction refunded');
          }, () => {
            this.uiService.notify('Unable to refund');
          });
        } else {
          future = this.$q.resolve();
        }

        future.finally(() => {
          promise.close.resolve();
        });
      });
  }

  readTransaction(transaction, item, user) {
    this.$mdDialog.show({
      controller: 'ViewTransactionController',
      controllerAs: 'controller',
      templateUrl: '/src/transaction/partial/view.html',
      clickOutsideToClose: true,
      locals: {
        transaction: transaction,
        item: item,
        user: user
      }
    });
  }

  deleteTransaction(transactionData, $event) {
    let confirm;
    let successMessage;
    let failureMessage;

    if (transactionData.Transaction.status === 2) {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to undo this revocation?')
        .ariaLabel('Revoke Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('UNDO')
        .cancel('Cancel');

        successMessage = 'Revocation reversed';
        failureMessage = 'Unable to undo revocation';
    } else {
      confirm = this.$mdDialog.confirm()
        .title('Are you sure you want to delete this?')
        .ariaLabel('Delete Transaction')
        .clickOutsideToClose(true)
        .targetEvent($event)
        .ok('DELETE')
        .cancel('Cancel');

        successMessage = 'Transaction deleted';
        failureMessage = 'Unable to delete transaction';
    }

    this.$mdDialog.show(confirm).then(() => {
      const storage = this.storageService.read();
      this.transactionService.delete(storage.auth.idToken, transactionData.Transaction.id).then(() => {
        this.uiService.notify(successMessage);
      }, () => {
        this.uiService.notify(failureMessage);
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
  '$q',
  '$state',
  '$mdDialog',
  'StorageService',
  'TransactionService',
  'PaypalService',
  'StripeService',
  'UserService',
  'UIService',
  'ToolsService',
  'db',
  'Transaction'
];