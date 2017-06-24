export default class CreateOrganizationController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    storageService,
    organizationService,
    uiService,
    Organization
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.Organization = Organization;

    this.storage = storageService.read();

    this.$scope.close = this.$mdDialog.hide;
    this.$scope.loading = false;
    this.$scope.organization = new this.Organization();
    this.$scope.organization.parentId = this.organizationService.rootOrganization.id;
  }

  submit() {
    this.$scope.loading = true;

    return this.organizationService.create(this.storage.auth.idToken).then(() => {
      this.$state.go('application.internal.organization.read');
      this.$mdDialog.hide();

      this.uiService.notify('Organization created');
    }, (response) => {
      const message = response.status === 409 ? 'Email has already been taken' : 'Unable to create Organization';
      this.uiService.notify(message);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateOrganizationController.$inject = [
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'OrganizationService',
  'UIService',
  'Organization'
];