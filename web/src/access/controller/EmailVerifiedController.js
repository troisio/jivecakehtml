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

    this.auth0Service.getUser(storage.auth.accessToken, storage.auth.idTokenPayload.sub).then((user) => {
      if (user.email_verified) {
        this.$mdDialog.hide();
        this.uiService.notify('Email verified');
      } else {
        this.uiService.notify('Email has not been verified');
      }
    });
  }

  resend() {
    this.$scope.loading = true;

    const storage = this.storageService.read();

    this.auth0Service.sendVerificationEmail(storage.auth.accessToken, {
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

EmailVerifiedController.$inject = ['$mdDialog', '$scope', 'UIService', 'Auth0Service', 'StorageService'];