export default class CreateOrganizationAndEventController {
  constructor($rootScope, $scope, $state, $mdDialog, uiService, storageService, organizationService, eventService, Organization, Event) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.uiService = uiService;
    this.storageService = storageService;
    this.organizationService = organizationService;
    this.eventService = eventService;

    this.$scope.organization = new Organization();
    this.$scope.event = new Event();
    this.$scope.hide = $mdDialog.hide;

    const storage = this.storageService.read();
    this.$scope.organization.email = storage.profile.email;
  }

  submit(organization, event) {
    const storage = this.storageService.read();

    this.$scope.loading = true;

    return this.organizationService.create(storage.auth.idToken, organization).then((organization) => {
      event.status = this.eventService.getInactiveEventStatus();

      return this.eventService.create(storage.auth.idToken, organization.id, event).then((event) => {
        this.$mdDialog.hide();
        this.uiService.notify('Event created');

        this.$rootScope.$broadcast('application.permission.refresh');

        this.$state.go('application.internal.event.update', {eventId: event.id});
      }, () => {
        this.uiService.notify('Unable to create event');
      });
    }, (response) => {
      const message = response.status === 409 ? 'Email has already been taken' : 'Unable to create Organization';
      this.uiService.notify(message);
    }).then(() => {
      this.$scope.loading = false;
    });
  }
}

CreateOrganizationAndEventController.$inject = ['$rootScope', '$scope', '$state', '$mdDialog', 'UIService', 'StorageService', 'OrganizationService', 'EventService', 'Organization', 'Event'];