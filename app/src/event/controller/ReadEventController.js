export default class ReadEventController {
  constructor(
    $window,
    $scope,
    $q,
    $state,
    $mdDialog,
    organizationService,
    eventService,
    relationalService,
    itemService,
    storageService,
    toolsService,
    settings,
    uiService
  ) {
    this.$window = $window;
    this.$scope = $scope;
    this.$q = $q;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.eventService = eventService;
    this.relationalService = relationalService;
    this.itemService = itemService;
    this.toolsService = toolsService;
    this.settings = settings;
    this.uiService = uiService;

    this.storage = storageService.read();
    this.$scope.$parent.$parent.selectedTab = 1;
    this.$scope.token = this.storage.auth.idToken;
    this.$scope.apiUri = settings.jivecakeapi.uri;
    this.$scope.selected = [];
    this.$scope.data = [];
    this.$scope.uiReady = false;
    this.run();
  }

  run() {
    this.$scope.$parent.ready.then((resolve) => {
      const organizationIds = resolve.permission.entity
        .filter(permission => permission.objectClass === this.organizationService.getObjectClassName())
        .map(permission => permission.objectId);
      const query = {
        order: '-lastActivity'
      };
      const failure = () => {
        this.uiService.notify('Unable to retrieve data');
      };

      let hasFilter = false;

      ['organizationId', 'id'].forEach((filter) => {
        if (typeof this.$state.params[filter] !== 'undefined') {
          query[filter] = this.$state.params[filter];
          hasFilter = true;
        }
      });

      if (!hasFilter) {
        query.organizationId = organizationIds;
      }

      return this.getEventData(query).then((searchResult) => {
        this.$scope.data = searchResult.entity;
      }, failure);
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  getEventData(query) {
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

        const removeIndex = this.$scope.data.indexOf(eventData);
        this.$scope.data.splice(removeIndex, 1);
      }, (response) => {
        const message = response.status === 401 ? 'You do not have permission to delete this event' : 'Unable to delete event';
        this.uiService.notify(message);
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    });
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
  '$mdDialog',
  'OrganizationService',
  'EventService',
  'RelationalService',
  'ItemService',
  'StorageService',
  'ToolsService',
  'settings',
  'UIService'
];