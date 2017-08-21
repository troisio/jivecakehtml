export default class InterneralApplicationController {
  constructor(
    $mdDialog,
    $scope,
    accessService
  ) {
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.accessService = accessService;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.showTabs = true;

    this.run();
  }

  run() {
    this.$scope.ready.then(() => {
      this.$scope.$on('jivecakeapi.oauth.invalid_grant', () => {
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
    });
  }
}

InterneralApplicationController.$inject = [
  '$mdDialog',
  '$scope',
  'AccessService'
];