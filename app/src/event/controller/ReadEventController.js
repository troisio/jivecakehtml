export default class ReadEventController {
  constructor(
    $window,
    $scope,
    $q,
    $state,
    $stateParams,
    $mdDialog,
    organizationService,
    eventService,
    relationalService,
    itemService,
    storageService,
    toolsService,
    settings,
    uiService,
    Paging,
    SearchEntity
  ) {
    this.$window = $window;
    this.$scope = $scope;
    this.$q = $q;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.eventService = eventService;
    this.relationalService = relationalService;
    this.itemService = itemService;
    this.toolsService = toolsService;
    this.settings = settings;
    this.uiService = uiService;
    this.Paging = Paging;
    this.SearchEntity = SearchEntity;

    this.storage = storageService.read();
    this.$scope.uiReady = false;
    this.$scope.$parent.$parent.selectedTab = 1;
    this.$scope.token = this.storage.auth.idToken;
    this.$scope.apiUri = settings.jivecakeapi.uri;
    this.$scope.selected = [];

    this.$scope.uiReady = false;

    this.pagingService = new this.Paging((data) => {
      return this.$q.resolve(data.count);
    }, (limit, offset) => {
      const query = this.toolsService.stateParamsToQuery($stateParams);

      delete query.page;
      delete query.pageSize;

      query.limit = limit;
      query.offset = offset;

      return this.eventService.search(this.storage.auth.idToken, query).then((eventSearchResult) => {
        const events = eventSearchResult.entity;

        let organizationFuture;

        if (events.length === 0) {
          organizationFuture = this.$q.resolve([]);
        } else {
          organizationFuture = this.organizationService.getOrganizationsByUser(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub);
        }

        return organizationFuture.then((organizations) => {
          const data = {
            count: eventSearchResult.count
          };

          data.entity = this.relationalService.oneToOneJoin(events, 'organizationId', organizations, 'id').map(function(joinedEntity) {
            return {
              event: joinedEntity.entity,
              organization: joinedEntity.foreign
            };
          });

          return data;
        });
      });
    });

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
    this.$scope.$parent.ready.then((resolve) => {
      const page = this.$window.parseInt(this.$stateParams.page);
      const pageSize = this.$window.parseInt(this.$stateParams.pageSize);

      this.loadPage(page, pageSize).then(function() {
      }, () => {
        this.uiService.notify('Unable to search events');
      });

      ['EVENT.CREATED', 'EVENT.UPDATED'].forEach((event) => {
        this.$scope.$on(event, () => {
          this.loadPage(page, pageSize);
        });
      });
    });
  }

  toggleStatus(eventData, $event) {
    this.eventService.fieldUpdate(this.storage.auth.idToken, eventData.event.id, {
      status: eventData.event.status
    }).then(function() {
    }, (response) => {
      if (eventData.event.status === this.eventService.getActiveEventStatus()) {
        eventData.event.status = this.eventService.getInactiveEventStatus();
      }

      if (this.$window.Array.isArray(response.data)) {
        this.$mdDialog.show({
          controllerAs: 'controller',
          controller: 'InsufficientSubscriptionController',
          templateUrl: '/src/event/partial/insufficientSubscriptions.html',
          clickOutsideToClose: true,
          locals: {
            subscriptions: response.data,
            organization: eventData.organization
          }
        });
      } else {
        const message = response.status === 401 ? 'You do not have permission to update this event' : 'Unable to update event' ;
        this.uiService.notify(message);
      }
    });
  }

  loadPage(page, pageSize) {
    this.$scope.uiReady = false;

    return this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  delete(eventData, $event) {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure you want to delete this event?')
      .ariaLabel('Delete Event')
      .clickOutsideToClose(true)
      .targetEvent($event)
      .ok('DELETE')
      .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.$scope.uiReady = false;

      this.eventService.delete(this.storage.auth.idToken, eventData.event.id).then(() => {
        this.uiService.notify('Event deleted');

        const removeIndex = this.$scope.paging.data.entity.indexOf(eventData);
        this.$scope.paging.data.entity.splice(removeIndex, 1);
      }, (response) => {
        const message = response.status === 401 ? 'You do not have permission to delete this event' : 'Unable to delete event';
        this.uiService.notify(message);
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    });
  }

  goToPublicPage(event) {
    if (event.status === this.eventService.getActiveEventStatus()) {
      this.$state.go('application.public.event.item', {id: event.id});
    } else {
      this.uiService.notify('Event must be active');
    }
  }

  createEvent() {
    this.$scope.$parent.ready.then((resolve) => {
      this.$mdDialog.show({
        controller: 'CreateEventController',
        controllerAs: 'controller',
        templateUrl: '/src/event/partial/create.html',
        clickOutsideToClose: true,
        locals: {
          permissions: resolve.permission.entity
        }
      });
    });
  }
}

ReadEventController.$inject = [
  '$window',
  '$scope',
  '$q',
  '$state',
  '$stateParams',
  '$mdDialog',
  'OrganizationService',
  'EventService',
  'RelationalService',
  'ItemService',
  'StorageService',
  'ToolsService',
  'settings',
  'UIService',
  'Paging',
  'SearchEntity'
];