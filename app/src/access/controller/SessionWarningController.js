export default class SessionWarningController {
  constructor($scope, $mdDialog, accessService) {
    this.$mdDialog = $mdDialog;
    this.accessService = accessService;
  }

  showSignIn() {
    this.accessService.oauthSignIn();
  }

  hide() {
    this.$mdDialog.hide();
  }
}

SessionWarningController.$inject = ['$scope', '$mdDialog', 'AccessService'];