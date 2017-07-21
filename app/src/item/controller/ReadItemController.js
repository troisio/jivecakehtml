import lf from 'lovefield';

export default class ReadItemController {
  constructor(
    $q,
    $scope,
    $state,
    $mdDialog,
    itemService,
    transactionService,
    permissionService,
    storageService,
    settings,
    uiService,
    db,
    Permission
  ) {
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.permissionService = permissionService;
    this.storageService = storageService;
    this.uiService = uiService;
    this.db = db;

    this.Permission = Permission;

    const storage = this.storageService.read();
    this.$scope.token = storage.auth.idToken;
    this.$scope.apiUrl = settings.jivecakeapi.uri;
    this.$scope.uiReady = false;
    this.$scope.selected = [];

    [
      'event.update',
      'item.create',
      'item.delete',
      'item.update',
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

    return this.$scope.$parent.ready.then(() => {
      const transactionTable = this.db.getSchema().table('Transaction');
      const permissionTable = this.db.getSchema().table('Permission');
      const eventTable = this.db.getSchema().table('Event');
      const itemTable = this.db.getSchema().table('Item');

      const and = [
        permissionTable.objectClass.eq('Organization')
      ];

      ['organizationId', 'eventId'].forEach(field => {
        const value = this.$state.params[field];

        if (value) {
          if (Array.isArray(value)) {
            and.push(itemTable[field].in(value));
          } else {
            and.push(itemTable[field].eq(value));
          }
        }
      });

      const columns = [permissionTable, eventTable, itemTable, transactionTable].reduce(function(columns, table) {
        columns.push.apply(columns, table.getColumns().map(column => table[column.getName()]));
        return columns;
      }, []);

      this.db.select()
        .from(permissionTable)
        .where(permissionTable.objectClass.eq('Application'))
        .exec()
        .then(rows => {
          if (rows.length > 0) {
            const hasPermission = new this.Permission().has;
            this.$scope.hasApplicationWrite = hasPermission.call(rows[0], this.permissionService.WRITE);
          } else {
            this.$scope.hasApplicationWrite = false;
          }
        });

      const storage = this.storageService.read();
      const userId = storage.auth.idTokenPayload.sub;

      const ands = [
        permissionTable.objectClass.eq('Organization'),
        permissionTable.user_id.eq(userId)
      ];

      if (typeof this.$state.params.eventId !== 'undefined') {
        if (Array.isArray(this.$state.params.eventId)) {
          ands.push(itemTable.eventId.in(this.$state.params.eventId));
        } else {
          ands.push(itemTable.eventId.eq(this.$state.params.eventId));
        }
      }

      return this.db.select(...columns)
        .from(itemTable)
        .innerJoin(eventTable, itemTable.eventId.eq(eventTable.id))
        .innerJoin(permissionTable, permissionTable.objectId.eq(itemTable.organizationId))
        .leftOuterJoin(transactionTable, transactionTable.itemId.eq(itemTable.id))
        .where(lf.op.and(...ands))
        .orderBy(itemTable.status, lf.Order.ASC)
        .orderBy(itemTable.lastActivity, lf.Order.DESC)
        .exec()
        .then(rows => {
          const data = [];

          if (rows.length > 0) {
            data.push(Object.assign({
              transactionCount: 0
            }, rows[0]));
          }

          for (let row of rows) {
            let itemData;
            const lastItem = data[data.length - 1];

            if (row.Item.id === lastItem.Item.id) {
              itemData = lastItem;
            } else {
              itemData = Object.assign({
                transactionCount: 0
              }, row);
              data.push(itemData);
            }

            const usedForCounting = this.transactionService.countingFilter(row.Transaction);

            if (usedForCounting) {
              itemData.transactionCount += row.Transaction.quantity;
            }
          }

          data.sort(function(first, second) {
            let result = second.status - first.status;

            if (result === 0) {
              result = second.lastActivity - first.lastActivity;
            }

            return result;
          });

          const item = data.find(datum => datum.Item.id === this.$state.params.highlight);
          const index = data.indexOf(item);

          if (index > -1) {
            data.splice(index, 1);
            data.unshift(item);
          }

          this.$scope.data = data;
        }, () => {
          this.uiService.notify('Unable to retrieve data');
        });
    }).then(() => {
      this.$scope.uiReady = true;
    }, () => {
      this.$scope.uiReady = true;
    }).then(() => {
      this.$scope.$apply();
    });
  }

  createItem() {
    const eventTable = this.db.getSchema().table('Event');
    const permissionTable = this.db.getSchema().table('Permission');

    this.db.select()
      .from(eventTable)
      .innerJoin(permissionTable, permissionTable.objectId.eq(eventTable.organizationId))
      .exec()
      .then(rows => {
        const hasPermission = new this.Permission().has;
        const eventsWithWrite = rows.filter(row => hasPermission.call(row.Permission, this.permissionService.WRITE));

        if (eventsWithWrite.length > 0) {
          this.$mdDialog.show({
            templateUrl: '/src/item/partial/create.html',
            controller: 'CreateItemController',
            controllerAs: 'controller',
            clickOutsideToClose: true
          });
        } else {
          this.uiService.notify('Create an event before creating items');
        }
      });
  }

 toggleStatus(item) {
   const storage = this.storageService.read();

   this.itemService.update(storage.auth.idToken, item).then(() => {
   }, () => {
     this.uiService.notify('Unable to update item');
   })
 }

  delete(itemData, $event) {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure you want to delete this item?')
      .ariaLabel('Delete Item')
      .clickOutsideToClose(true)
      .targetEvent($event)
      .ok('DELETE')
      .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      const storage = this.storageService.read();
      this.itemService.delete(storage.auth.idToken, itemData.Item.id).then(() => {
        this.uiService.notify('Item deleted');
      }, (response) => {
        let message;
        if (typeof response.data === 'object' && response.data.error === 'transaction') {
          message = 'Can not delete. Item has transactions';
        } else {
          message = 'Unable to delete item';
        }

        this.uiService.notify(message);
      });
    });
  }
}

ReadItemController.$inject = [
  '$q',
  '$scope',
  '$state',
  '$mdDialog',
  'ItemService',
  'TransactionService',
  'PermissionService',
  'StorageService',
  'settings',
  'UIService',
  'db',
  'Permission'
];