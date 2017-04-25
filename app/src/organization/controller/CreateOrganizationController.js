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
    this.$scope.uiReady = false;
    this.$scope.organization = new this.Organization();

    this.rootOrganizationPromise = this.organizationService.publicSearch({
      parentId: null
    }).then(function(searchResult) {
      return searchResult.entity[0];
    });

    this.run();
  }

  run() {
    this.organizationService.search(this.storage.auth.idToken, {}).then((paging) => {
      const organizations = paging.entity;

      organizations.sort(function(first, second) {
        let result;

        if (first.parentId === null) {
          result = -1;
        } else if (second.parentId === null) {
          result = 1;
        } else {
          result = 0;
        }

        return result;
      });

      this.$scope.organizations = organizations;
    }).finally(() => {
      this.$scope.uiReady = true;
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