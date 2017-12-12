export default class EmailVerifiedController {
  constructor($mdDialog, $scope, uiService, auth0Service, storageService, lock) {
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.uiService = uiService;
    this.auth0Service = auth0Service;
    this.storageService = storageService;
    this.lock = lock;

    this.$scope.loading = false;
  }

  verify() {
    this.$scope.loading = true;

    const storage = this.storageService.read();

    this.lock.getUserInfo(storage.auth.accessToken, (error, user) => {
      if (error) {
        this.uiService.notify('Unable to retrieve user data for verification');
      } else {
        if (user.email_verified) {
          this.$mdDialog.hide();
          this.uiService.notify('Email verified');
        } else {
          this.uiService.notify('Email has not been verified');
        }
      }

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
    })
    .then(() => {}, () => {})
    .then(() => {
      this.$scope.loading = false;
    });
  }
}

EmailVerifiedController.$inject = ['$mdDialog', '$scope', 'UIService', 'Auth0Service', 'StorageService', 'lock'];