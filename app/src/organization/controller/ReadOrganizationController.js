export default class ReadOrganizationController {
  constructor(
    $scope,
    $mdDialog,
    storageService,
    organizationService,
    uiService
  ) {
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.uiService = uiService;

    this.storage = storageService.read();

    this.$scope.selected = [];
    this.$scope.$parent.$parent.selectedTab = 0;
    this.$scope.uiReady = false;

    this.run();
  }

  run() {
    this.$scope.$parent.ready.then(resolve => {
      return this.organizationService.getOrganizationsByUser(
        this.storage.auth.idToken,
        this.storage.auth.idTokenPayload.sub,
        {
          order: '-lastActivity'
        }
      ).then((organizations) => {
        this.$scope.data = this.organizationService.getOrganizationsWithPermissions(
          organizations,
          resolve.permission.entity
        );
      });
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  delete(organizationData, $event) {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure you want to delete this organization?')
      .ariaLabel('Delete Organization')
      .clickOutsideToClose(true)
      .targetEvent($event)
      .ok('DELETE')
      .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      this.$scope.uiReady = false;

      this.organizationService.delete(this.storage.auth.idToken, organizationData.organization.id).then(() => {
        this.uiService.notify('Organization deleted');

        const removeIndex = this.$scope.data.indexOf(organizationData);
        this.$scope.data.splice(removeIndex, 1);
      }, () => {
        this.uiService.notify('Unable to delete organization');
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    });
  }

  createOrganization() {
    this.$mdDialog.show({
      controller: 'CreateOrganizationController',
      controllerAs: 'controller',
      templateUrl: '/src/organization/partial/create.html',
      clickOutsideToClose: true
    });
  }
}

ReadOrganizationController.$inject = [
  '$scope',
  '$mdDialog',
  'StorageService',
  'OrganizationService',
  'UIService'
];