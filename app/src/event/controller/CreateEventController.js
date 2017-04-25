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
    permissions
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.eventService = eventService;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.Event = Event;
    this.permissions = permissions;

    this.$scope.loading = false;
    this.$scope.uiReady = false;

    this.storage = storageService.read();

    this.run();
  }

  run() {
    this.$scope.event = new this.Event();
    this.$scope.event.minimumTimeBetweenTransactionTransfer = -1;

    this.organizationService.getOrganizationsByUser(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub).then((organizations) => {
      const data = this.organizationService.getOrganizationsWithPermissions(organizations, this.permissions);
      organizations = data.filter(datum => datum.permissions.has(this.organizationService.getWritePermission()))
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

    return this.eventService.create(this.storage.auth.idToken, event.organizationId, event).then((event) => {
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
  'permissions'
];