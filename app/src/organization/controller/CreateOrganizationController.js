export default class CreateOrganizationController {
  constructor(
    $rootScope,
    $scope,
    $state,
    $mdDialog,
    storageService,
    organizationService,
    uiService,
    Organization
  ) {
    this.$rootScope = $rootScope;
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

    this.rootOrganizationPromise = this.organizationService.publicSearch({
      parentId: null
    }).then(function(searchResult) {
      return searchResult.entity[0];
    });
  }

  submit(organization) {
    this.$scope.loading = true;

    this.rootOrganizationPromise.then(rootOrganization => {
      organization.parentId = rootOrganization.id;

      return this.organizationService.create(this.storage.auth.idToken, organization).then(organization => {
        this.$state.go('application.internal.organization.read', {}, {reload: true});
        this.$mdDialog.hide();

        this.uiService.notify('Organization created');
      }, (response) => {
        const message = response.status === 409 ? 'Email has already been taken' : 'Unable to create Organization';
        this.uiService.notify(message);
      });
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateOrganizationController.$inject = [
  '$rootScope',
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'OrganizationService',
  'UIService',
  'Organization'
];