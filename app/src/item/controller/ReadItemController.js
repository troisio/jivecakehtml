export default class ReadItemController {
  constructor(
    $window,
    $q,
    $scope,
    $state,
    $mdDialog,
    applicationService,
    eventService,
    itemService,
    transactionService,
    permissionService,
    organizationService,
    storageService,
    settings,
    uiService,
    toolsService,
    paypalService,
    relationalService,
    SearchEntity,
    Paging
  ) {
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.applicationService = applicationService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.toolsService = toolsService;
    this.paypalService = paypalService;
    this.relationalService = relationalService;
    this.SearchEntity = SearchEntity;
    this.Paging = Paging;

    this.storage = storageService.read();
    this.pagingService = new this.Paging((data) => {
      return this.$q.resolve(data.count);
    }, (limit, offset) => {
      const query = this.toolsService.stateParamsToQuery(this.$state.params);

      delete query.page;
      delete query.pageSize;

      query.limit = limit;
      query.offset = offset;

      return this.itemService.search(this.storage.auth.idToken, query).then((itemSearchResult) => {
        const items = itemSearchResult.entity;
        const eventIds = items.map(item => item.eventId);
        const itemIds = items.map(item => item.id);
        const eventFuture = eventIds.length === 0 ? this.$q.resolve(new this.SearchEntity()) : this.eventService.search(this.storage.auth.idToken, {id: eventIds});

        let transactionFuture;

        if (itemIds.length > 0) {
          transactionFuture = this.transactionService.search(this.storage.auth.idToken, {
            itemId: itemIds,
            leaf: true,
            status: this.transactionService.getUsedForCountingStatuses()
          });
        } else {
          transactionFuture = this.$q.resolve(new this.SearchEntity());
        }

        return this.$q.all([
          transactionFuture,
          eventFuture
        ]).then((resolve) => {
          const transactionSearchResult = resolve[0];
          const eventSearchResult = resolve[1];
          const itemsWithEvent = this.relationalService.oneToOneJoin(
            items,
            'eventId',
            eventSearchResult.entity,
            'id'
          );
          const itemWithTransactions = this.relationalService.leftJoin(
            items,
            'id',
            transactionSearchResult.entity,
            'itemId'
          );

          const data = items.map(function(item, index) {
            const transactions = itemWithTransactions[index].foreign;
            const transactionCount = transactions.reduce((previous, next) => previous + next.quantity, 0);

            return {
              item: item,
              transactions: transactions,
              transactionCount: transactionCount,
              event: itemsWithEvent[index].foreign
            };
          });

          return {
            entity: data,
            count: itemSearchResult.count
          };
        });
      });
    });

    this.$scope.apiUrl = settings.jivecakeapi.uri;
    this.$scope.uiReady = false;
    this.$scope.selected = [];
    this.$scope.query = {
      limit: this.$window.parseInt(this.$state.params.pageSize),
      page: this.$window.parseInt(this.$state.params.page) + 1
    };

    this.$scope.paginate = () => {
      this.loadPage(this.$scope.query.page - 1, this.$scope.query.limit);
    };

    this.run();
  }

  run() {
    this.$scope.token = this.storage.auth.idToken;
    this.$scope.hasApplicationWrite = false;

    this.$scope.$parent.ready.then((resolve) => {
      const permissions = resolve.permission.entity;
      const applicationWritePermissions = permissions.filter((permission) =>
        permission.objectClass === this.applicationService.getObjectClassName() &&
        permission.has(this.applicationService.getReadPermission())
      );

      const organizationWritePermissions = permissions.filter((permission) =>
        permission.objectClass === this.organizationService.getObjectClassName() &&
        permission.has(this.organizationService.getWritePermission())
      );

      this.$scope.hasOrganizationWrite = organizationWritePermissions.length > 0;
      this.$scope.hasApplicationWrite = applicationWritePermissions.length > 0;
    });

    ['ITEM.DELETED', 'ITEM.CREATED', 'ITEM.UPDATED'].forEach((event) => {
      this.$scope.$on(event, () => {
        this.loadPage(0, 5);
      });
    });

    this.loadPage(
      this.$window.parseInt(this.$state.params.page),
      this.$window.parseInt(this.$state.params.pageSize)
    );
  }

  loadPage(page, pageSize) {
    this.$scope.uiReady = false;

    this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  createItem() {
    this.$scope.$parent.ready.then((resolve) => {
      this.$mdDialog.show({
        templateUrl: '/src/item/partial/create.html',
        controller: 'CreateItemController',
        controllerAs: 'controller',
        clickOutsideToClose: true,
        locals: {
          permissions: resolve.permission.entity
        }
      });
    });
  }

  createPaypalTransaction(item) {
    this.$q.all({
      event: this.eventService.read(this.storage.auth.idToken, item.eventId),
      detail: this.paypalService.createPaymentDetails(this.storage.auth.idToken)
    }).then(resolve => {
      const details = resolve.detail;
      const event = resolve.event;
      const time = new this.$window.Date().getTime();
      const txn_id = time.toString();

      this.paypalService.getCartIpn(
        [{
          quantity: 3,
          item: item
        }],
        new this.$window.Date().getTime(),
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
      this.itemService.delete(this.storage.auth.idToken, itemData.item.id).then(() => {
        this.uiService.notify('Item deleted');

        const removeIndex = this.$scope.paging.data.entity.indexOf(itemData.item);
        this.$scope.paging.data.entity.splice(removeIndex, 1);
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
  '$window',
  '$q',
  '$scope',
  '$state',
  '$mdDialog',
  'ApplicationService',
  'EventService',
  'ItemService',
  'TransactionService',
  'PermissionService',
  'OrganizationService',
  'StorageService',
  'settings',
  'UIService',
  'ToolsService',
  'PaypalService',
  'RelationalService',
  'SearchEntity',
  'Paging'
];