export default class CreateEventController {
  constructor(
    $rootScope,
    $scope,
    $mdDialog,
    eventService,
    storageService,
    organizationService,
    uiService,
    Event,
    user
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.eventService = eventService;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.Event = Event;
    this.user = user;

    this.$scope.loading = false;
    this.$scope.uiReady = false;

    this.storage = storageService.read();

    this.run();
  }

  run() {
    this.$scope.event = new this.Event();

    this.organizationService.getOrganizationArrayWithPermissions(this.storage.token, this.user.user_id).then(data => {
      const organizations = data.filter(datum => datum.permissions.has(this.organizationService.getWritePermission()))
                                .map(datum => datum.organization);

      if (organizations.length > 0) {
        this.$scope.event.organizationId = organizations[0].id;
      }

      this.$scope.organizations = organizations;
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  createEvent(event) {
    this.$scope.loading = true;

    return this.eventService.create(this.storage.token, event.organizationId, event).then((event) => {
      this.uiService.notify('Event created');
      this.$rootScope.$broadcast('EVENT.CREATED', event);
      this.$mdDialog.hide();
    }, (response) => {
      const message = response.status === 409 ? 'Sorry, that name has already been taken' : 'Unable to create event';
      this.uiService.notify(message);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateEventController.$inject = [
  '$rootScope',
  '$scope',
  '$mdDialog',
  'EventService',
  'StorageService',
  'OrganizationService',
  'UIService',
  'Event',
  'user'
];