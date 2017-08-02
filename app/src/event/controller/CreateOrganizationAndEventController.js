export default class CreateOrganizationAndEventController {
  constructor($scope, $state, $mdDialog, uiService, storageService, organizationService, eventService, Organization, Event) {
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

    this.rootOrganizationPromise = this.organizationService.publicSearch({
      parentId: null
    }).then(function(searchResult) {
      return searchResult.entity[0];
    }).finally(() => {
      this.$scope.uiReady = true;
    });

    this.run();
  }

  run() {
    this.$scope.uiReady = false;
  }

  submit(organization, event) {
    const storage = this.storageService.read();

    this.$scope.loading = true;

    this.rootOrganizationPromise.then((rootOrganization) => {
      organization.parentId = rootOrganization.id;

      return this.organizationService.create(storage.auth.idToken, organization).then((organization) => {
        event.status = this.eventService.getInactiveEventStatus();

        return this.eventService.create(storage.auth.idToken, organization.id, event).then((event) => {
          this.$mdDialog.hide();
          this.uiService.notify('Event created');
          this.$state.go('application.internal.event.update', {eventId: event.id});
        }, () => {
          this.uiService.notify('Unable to create event');
        });
      }, (response) => {
        const message = response.status === 409 ? 'Email has already been taken' : 'Unable to create Organization';
        this.uiService.notify(message);
      });
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateOrganizationAndEventController.$inject = ['$scope', '$state', '$mdDialog', 'UIService', 'StorageService', 'OrganizationService', 'EventService', 'Organization', 'Event'];