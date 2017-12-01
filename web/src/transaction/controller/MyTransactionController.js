import lf from 'lovefield';
import transactionPartialView from '../partial/view.html';
import viewItemPartial from '../../public/partial/viewItem.html';

export default class MyTransactionController {
  constructor(
    $timeout,
    $scope,
    $mdDialog,
    storageService,
    itemService,
    transactionService,
    uiService,
    db
  ) {
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.uiService = uiService;
    this.db = db;

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

    this.$scope.$parent.ready.then(() => {
      this.run();
    });
  }

  run() {
    this.$scope.uiReady = false;

    const storage = this.storageService.read();
    const transactionTable = this.db.getSchema().table('Transaction');
    const eventTable = this.db.getSchema().table('Event');
    const itemTable = this.db.getSchema().table('Item');
    const selectColumns = [];

    [transactionTable, itemTable, eventTable].forEach(table => {
      table.getColumns()
        .map(column => table[column.getName()])
        .forEach(column => selectColumns.push(column));
    });

    this.db.select(...selectColumns)
      .from(transactionTable)
      .innerJoin(itemTable, itemTable.id.eq(transactionTable.itemId))
      .innerJoin(eventTable, eventTable.id.eq(transactionTable.eventId))
      .where(
        transactionTable.user_id.eq(storage.auth.idTokenPayload.sub),
        transactionTable.leaf.eq(true),
        lf.op.or(
          transactionTable.paymentStatus.eq(this.transactionService.SETTLED),
          transactionTable.paymentStatus.eq(this.transactionService.PENDING)
        )
      )
      .orderBy(transactionTable.timeCreated, lf.Order.DESC)
      .exec()
      .then((rows) => {
        this.$scope.rows = rows;
      })
      .then(() => {}, () => {})
      .then(() => {
        this.$scope.uiReady = true;
        this.$timeout();
      });
  }

  readTransaction(row) {
    const storage = this.storageService.read();

    this.$mdDialog.show({
      controller: 'ViewTransactionController',
      controllerAs: 'controller',
      template: transactionPartialView,
      clickOutsideToClose: true,
      locals: {
        transaction: row.Transaction,
        item: row.Item,
        user: storage.profile,
        event: row.Event
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
      template: viewItemPartial,
      clickOutsideToClose: true,
      locals: {
        item: item
      }
    });
  }
}

MyTransactionController.$inject = [
  '$timeout',
  '$scope',
  '$mdDialog',
  'StorageService',
  'ItemService',
  'TransactionService',
  'UIService',
  'db'
];