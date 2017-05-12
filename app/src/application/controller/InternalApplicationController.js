export default class InterneralApplicationController {
  constructor(
    $mdDialog,
    $scope,
    organizationService,
    storageService,
    accessService
  ) {
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.organizationService = organizationService;
    this.storageService = storageService;
    this.accessService = accessService;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.showTabs = true;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.ready.then(resolve => {
      this.$scope.user = resolve.user;
      const permissions = resolve.permission.entity;

      this.$scope.organizationIds = permissions.filter(permission => permission.objectClass === this.organizationService.getObjectClassName())
        .map(permission => permission.objectId);

      this.$scope.$on('jivecakeapi.oauth.invalid_grant', (event, error) => {
        this.$mdDialog.show({
          templateUrl: '/src/access/partial/sessionWarning.html',
          controller: 'SessionWarningController',
          controllerAs: 'controller',
          clickOutsideToClose: true
        }).then(function() {
        }, () => {
          this.accessService.logout();
        }).finally(() => {
          this.accessService.logout();
        });
      });
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }
}

InterneralApplicationController.$inject = [
  '$mdDialog',
  '$scope',
  'OrganizationService',
  'StorageService',
  'AccessService'
];