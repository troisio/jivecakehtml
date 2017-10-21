import lf from 'lovefield';
import angular from 'angular';

export default class ReadEventController {
  constructor(
    $scope,
    $timeout,
    $state,
    $mdDialog,
    organizationService,
    eventService,
    itemService,
    storageService,
    toolsService,
    settings,
    uiService,
    db
  ) {
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.storageService = storageService;
    this.toolsService = toolsService;
    this.settings = settings;
    this.uiService = uiService;
    this.db = db;

    this.$scope.$parent.$parent.selectedTab = 1;
    this.$scope.selected = [];

    [
      'event.create',
      'event.delete'
    ].forEach((name) => {
      $scope.$on(name, () => {
        this.run();
      });
    });

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    return this.$scope.$parent.ready.then(() => {
      const storage = this.storageService.read();
      this.$scope.token = storage.auth.idToken;

      const permissionTable = this.db.getSchema().table('Permission');
      const eventTable = this.db.getSchema().table('Event');
      const organizationTable = this.db.getSchema().table('Organization');
      const and = [
        permissionTable.objectClass.eq('Organization')
      ];

      if (this.$state.params.organizationId) {
        const value = this.$state.params.organizationId;
        const arrayValue = Array.isArray(value) ? value : [value];
        and.push(eventTable.organizationId.in(arrayValue));
      }

      return this.db.select()
        .from(eventTable)
        .innerJoin(organizationTable, organizationTable.id.eq(eventTable.organizationId))
        .leftOuterJoin(permissionTable, permissionTable.objectId.eq(organizationTable.id))
        .where(lf.op.and(...and))
        .orderBy(eventTable.status, lf.Order.DESC)
        .orderBy(eventTable.lastActivity, lf.Order.DESC)
        .limit(100)
        .exec()
        .then(rows => {
          const data = angular.copy(rows);

          const event = data.find(datum => datum.Event.id === this.$state.params.highlight);
          const index = data.indexOf(event);

          if (index > -1) {
            data.splice(index, 1);
            data.unshift(event);
          }

          this.$scope.data = data;
        });
    }).then(() => {
    }, () => {
      this.uiService.notify('Unable to retrieve data');
    }).then(() => {
      this.$scope.uiReady = true;
      this.$timeout();
    })
  }

  toggleStatus(eventData) {
    const storage = this.storageService.read();
    const updateFuture = this.eventService.fieldUpdate(storage.auth.idToken, eventData.Event.id, {
      status: eventData.Event.status
    });

    if (eventData.Event.status === this.eventService.getActiveEventStatus()) {
      this.$mdDialog.show({
        controller: ['$window', '$scope', '$mdDialog', 'EventService', 'event', function($window, $scope, $mdDialog, eventService, event) {
          $scope.$mdDialog = $mdDialog;
          $scope.loading = true;
          $scope.event = event;
          $scope.flex = 10;
          $scope.eventUrl = window.location.protocol + '//' + window.location.hostname + '/e/' + event.hash;
          $scope.eventUrlDisplay = window.location.hostname + '/e/' + event.hash;

          updateFuture.then((event) => {
            if (event.status === eventService.getInactiveEventStatus()) {
              $mdDialog.hide();
            } else {
              $scope.loading = false;
            }
          }).then(() => {
            if ($window.innerWidth < 500) {
              $scope.flex = 80;
            } else {
              $scope.flex = 55;
            }
          })
        }],
        templateUrl: '/src/event/partial/eventActiveFeedback.html',
        clickOutsideToClose: false,
        locals: {
          event: eventData.Event
        }
      });
    }

    updateFuture.then(() => {
    }, (response) => {
      this.$mdDialog.hide().then(() => {
        if (eventData.Event.status === this.eventService.getActiveEventStatus()) {
          eventData.Event.status = this.eventService.getInactiveEventStatus();
        }

        if (typeof response.data === 'object' && response.data.error === 'subscription') {
          this.$mdDialog.show({
            controllerAs: 'controller',
            controller: 'InsufficientSubscriptionController',
            templateUrl: '/src/event/partial/insufficientSubscriptions.html',
            clickOutsideToClose: true,
            locals: {
              subscriptions: response.data,
              organization: eventData.Organization,
              onSubscribe: () => {
                this.eventService.fieldUpdate(storage.auth.idToken, eventData.Event.id, {
                  status: this.eventService.getActiveEventStatus()
                }).then(() => {
                  eventData.Event.status = this.eventService.getActiveEventStatus();
                  this.$timeout();
                })
              }
            }
          });
        } else {
          const message = response.status === 401 ? 'You do not have permission to update this event' : 'Unable to update event';
          this.uiService.notify(message);
        }
      });
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
      const storage = this.storageService.read();

      this.eventService.delete(storage.auth.idToken, eventData.Event.id).then(() => {
        this.uiService.notify('Event deleted');
      }, (response) => {
        const message = response.status === 401 ? 'You do not have permission to delete this event' : 'Unable to delete event';
        this.uiService.notify(message);
      });
    });
  }

  downloadTransactions(event) {
    const storage = this.storageService.read();

    const loader = this.uiService.load();

    this.eventService.getExcel(storage.auth.idToken, event.id).then((asset) => {
      loader.close.resolve();

      this.$mdDialog.show({
        template: `
        <md-dialog flex="80" layout-align="center center">
          <div layout-padding layout-margin>
            <a href="https://storage.googleapis.com/${asset.assetId}">download file</a>
          </div>
        </md-dialog>
        `,
        clickOutsideToClose: true
      });
    }, () => {
      loader.close.resolve();
      this.uiService.notify('Unable to generate file');
    });
  }

  createEvent() {
    this.$mdDialog.show({
      controller: 'CreateEventController',
      controllerAs: 'controller',
      templateUrl: '/src/event/partial/create.html',
      clickOutsideToClose: true
    });
  }
}

ReadEventController.$inject = [
  '$scope',
  '$timeout',
  '$state',
  '$mdDialog',
  'OrganizationService',
  'EventService',
  'ItemService',
  'StorageService',
  'ToolsService',
  'settings',
  'UIService',
  'db'
];