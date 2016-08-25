export default class UpdateAccountController {
  constructor($scope, $mdDialog, auth0Service, storageService, uiService) {
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.auth0Service = auth0Service;
    this.uiService = uiService;
    this.storageService = storageService;

    this.$scope.$parent.showTabs = false;

    this.storage = this.storageService.read();
    this.user = null;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.auth0Service.getUser(this.storage.token, this.storage.profile.user_id).then((user) => {
      this.user = user;
      this.$scope.isIdentityProviderAccount = user.user_id.startsWith('facebook') || user.user_id.startsWith('google');

      this.$scope.user = {
        email: user.email
      };

      if (this.$scope.isIdentityProviderAccount) {
        this.$scope.user.given_name = user.given_name;
        this.$scope.user.family_name = user.family_name;
      } else {
        if ('user_metadata' in user) {
          this.$scope.user.given_name = user.user_metadata.given_name;
          this.$scope.user.family_name = user.user_metadata.family_name;
        }
      }
    }, () => {
      this.uiService.notify('Unable to get user information');
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  submit(user) {
    this.$scope.loading = true;
    let body = {
      email: user.email,
      user_metadata: {
        given_name: user.given_name,
        family_name: user.family_name
      }
    };

    this.auth0Service.updateUser(this.storage.token, this.storage.profile.user_id, body).then((user) => {
      this.$scope.$parent.$parent.user = user;

      const storage = this.storageService.read();
      storage.profile = user;
      this.storageService.write(storage);
      this.uiService.notify('Successfully updated');
    }, () => {
      this.uiService.notify('Unable to update');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

UpdateAccountController.$inject = ['$scope', '$mdDialog', 'Auth0Service', 'StorageService', 'UIService'];