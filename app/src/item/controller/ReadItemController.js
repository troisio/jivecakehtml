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
    itemTransactionService,
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
    this.itemTransactionService = itemTransactionService;
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

      return this.itemService.search(this.storage.token, query).then((itemSearch) => {
        const eventIds = itemSearch.entity.map(item => item.eventId);
        const evenFuture = eventIds.length === 0 ? this.$q.resolve(new this.SearchEntity()) : this.eventService.search(this.storage.token, {id: eventIds});

        return evenFuture.then((eventSearch) => {
          const data = this.relationalService.oneToOneJoin(itemSearch.entity, 'eventId', eventSearch.entity, 'id').map((data) => {
            return {
              item: data.entity,
              event: data.foreign
            };
          });

          return {
            entity: data,
            count: itemSearch.count
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
    this.$scope.token = this.storage.token;
    this.$scope.hasApplicationWrite = false;

    this.$scope.$parent.ready.then((resolve) => {
      const permissions = resolve.permission.entity;
      const applicationWritePermissions = permissions.filter((permission) => {
        return permission.objectClass === this.applicationService.getObjectClassName() &&
               permission.has(this.applicationService.getReadPermission());
      });

      const organizationWritePermissions = permissions.filter((permission) => {
        return permission.objectClass === this.organizationService.getObjectClassName() &&
               permission.has(this.organizationService.getWritePermission());
      });

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
      event: this.eventService.read(this.storage.token, item.eventId),
      detail: this.paypalService.createPaymentDetails(this.storage.token)
    }).then(resolve => {
      const details = resolve.detail;
      const event = resolve.event;
      const time = new this.$window.Date().getTime();
      const txn_id = time.toString();
      this.paypalService.getCartIpn(
        [{
          quantity: 1,
          item: item
        }],
        new this.$window.Date().getTime(),
        event.currency,
        txn_id,
        'Completed',
        '',
        details.custom
      ).then(ipn => {
        this.paypalService.submitIpn(this.storage.token, ipn, 'VERIFIED');
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
      this.itemService.delete(this.storage.token, itemData.item.id).then(() => {
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
  'ItemTransactionService',
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