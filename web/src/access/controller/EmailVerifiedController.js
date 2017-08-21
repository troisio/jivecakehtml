export default class EmailVerifiedController {
  constructor($mdDialog, $scope, uiService, auth0Service, storageService) {
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.uiService = uiService;
    this.auth0Service = auth0Service;
    this.storageService = storageService;

    this.$scope.loading = false;
  }

  verify() {
    this.$scope.loading = true;

    const storage = this.storageService.read();

    this.auth0Service.getUser(storage.auth.idToken, storage.auth.idTokenPayload.sub).then((user) => {
      if (user.email_verified) {
        this.$mdDialog.hide();
        this.uiService.notify('Email verified');
      } else {
        this.uiService.notify('Email has not verified');
      }
    }, () => {
      this.uiService.notify('Unable to retrieve user data for verification');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }

  resend() {
    this.$scope.loading = true;

    const storage = this.storageService.read();

    this.auth0Service.sendVerificationEmail(storage.auth.idToken, {
      user_id: storage.auth.idTokenPayload.sub
    }).then(() => {
      this.uiService.notify('Verification email sent');
    }, () => {
      this.uiService.notify('Unable to send verification email');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

EmailVerifiedController.$inject = ['$mdDialog', '$scope', 'UIService', 'Auth0Service', 'StorageService'];