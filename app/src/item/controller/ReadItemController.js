export default class ReadItemController {
  constructor(
    $q,
    $scope,
    $state,
    $mdDialog,
    applicationService,
    eventService,
    itemService,
    transactionService,
    organizationService,
    permissionService,
    storageService,
    settings,
    uiService,
    paypalService,
    db,
    Permission
  ) {
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.applicationService = applicationService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.paypalService = paypalService;
    this.db = db;
    this.Permission = Permission;

    this.storage = storageService.read();

    this.$scope.token = this.storage.auth.idToken;
    this.$scope.apiUrl = settings.jivecakeapi.uri;
    this.$scope.uiReady = false;
    this.$scope.selected = [];

    [
      'event.update',
      'item.create',
      'item.delete',
      'item.update',
      'transaction.created',
      'transaction.revoke',
      'transaction.deleted'
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
      const permissionTable = this.db.getSchema().table('Permission');
      const eventTable = this.db.getSchema().table('Event');
      const itemTable = this.db.getSchema().table('Item');
      const transactionTable = this.db.getSchema().table('Transaction');

      const and = [
        permissionTable.objectClass.eq('Organization')
      ];

      ['organizationId', 'eventId'].forEach((field) => {
        const value = this.$state.params[field];

        if (value) {
          const arrayValue = Array.isArray(value) ? value : [value];
          and.push(itemTable[field].in(arrayValue));
        }
      });

      const columns = [lf.fn.count(transactionTable.id).as('transactionCount')];

      [permissionTable, eventTable, itemTable, transactionTable].forEach(table => {
        table.getColumns()
          .map(column => table[column.getName()])
          .forEach(column => columns.push(column));
      });

      this.db.select()
        .from(permissionTable)
        .where(permissionTable.objectClass.eq('Application'))
        .exec()
        .then(rows => {
          if (rows.length > 0) {
            const hasPermission = new this.Permission().has;
            const permission = rows[0];
            this.$scope.hasApplicationWrite = hasPermission.call(permission, this.permissionService.WRITE);
          } else {
            this.$scope.hasApplicationWrite = false;
          }
        });

      return this.db.select(...columns)
        .from(itemTable)
        .innerJoin(eventTable, itemTable.eventId.eq(eventTable.id))
        .innerJoin(permissionTable, permissionTable.objectId.eq(itemTable.organizationId))
        .leftOuterJoin(transactionTable, transactionTable.itemId.eq(itemTable.id))
        .where(lf.op.and(...and))
        .groupBy(itemTable.id)
        .orderBy(itemTable.status, lf.Order.DESC)
        .orderBy(itemTable.lastActivity, lf.Order.DESC)
        .exec()
        .then(rows => {
          const data = angular.copy(rows);

          const item = data.find(datum => datum.Item.id === this.$state.params.highlight);
          const index = data.indexOf(item);

          if (index > -1) {
            data.splice(index, 1);
            data.unshift(item);
          }

          this.$scope.data = rows;
        }, (err) => {
          this.uiService.notify('Unable to retrieve data');
        });
    }).finally(() => {
      this.$scope.uiReady = true;
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
          this.uiService.notify('Create some events before creating items');
        }
      });
  }

  createPaypalTransaction(item) {
    this.$q.all({
      event: this.eventService.read(this.storage.auth.idToken, item.eventId),
      detail: this.paypalService.createPaymentDetails(this.storage.auth.idToken)
    }).then(resolve => {
      const details = resolve.detail;
      const event = resolve.event;
      const time = new Date().getTime();
      const txn_id = time.toString();

      this.paypalService.getCartIpn(
        [{
          quantity: 3,
          item: item
        }],
        new Date().getTime(),
        event.currency,
        txn_id,
        'Completed',
        '',
        details.custom
      ).then(ipn => {
        this.paypalService.submitIpn(this.storage.auth.idToken, ipn, 'VERIFIED').then(() => {
          this.uiService.notify('Transaction created');
        }, () => {
          this.uiService.notify('Unable to submit IPN');
        });
      });
    }).then(function() {
    }, () => {
      this.uiService.notify('Unable to create Test Instant Payment Notification');
    });
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
      this.itemService.delete(this.storage.auth.idToken, itemData.Item.id).then(() => {
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
  'ApplicationService',
  'EventService',
  'ItemService',
  'TransactionService',
  'OrganizationService',
  'PermissionService',
  'StorageService',
  'settings',
  'UIService',
  'PaypalService',
  'db',
  'Permission'
];