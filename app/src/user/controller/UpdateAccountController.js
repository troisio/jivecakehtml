export default class UpdateAccountController {
  constructor($window, $q, $scope, auth0Service, storageService, userService, uiService) {
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.auth0Service = auth0Service;
    this.uiService = uiService;
    this.storageService = storageService;
    this.userService = userService;

    this.storage = this.storageService.read();
    this.user = null;

    $scope.$parent.showTabs = false;
    $scope.storage = this.storage;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.auth0Service.getUser(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub).then((user) => {
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
    const fileElement = document.querySelector('[name=photo]');

    const filePromise = this.$q.defer();
    const futures = [filePromise.promise, this.$q.resolve()];

    if (fileElement.files.length > 0) {
      const fileReader = new this.$window.FileReader();
      const file = fileElement.files[0];

      fileReader.onloadend = (event) => {
        const data = new this.$window.Uint8Array(event.target.result);
        const future = this.userService.uploadSelfie(this.storage.auth.idToken, this.user.user_id, data, file.type);

        filePromise.resolve(future);
      };

      fileReader.readAsArrayBuffer(file);
    } else {
      filePromise.resolve();
    }

    if (!this.$scope.isIdentityProviderAccount) {
      this.$scope.loading = true;
      let body = {
        email: user.email,
        user_metadata: {
          given_name: user.given_name,
          family_name: user.family_name
        }
      };

      const future = this.auth0Service.updateUser(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub, body).then((user) => {
        this.$scope.$parent.$parent.user = user;
      });

      futures[1] = future;
    }

    this.$scope.loading = true;

    this.$q.all(futures).then((responses) => {
      this.uiService.notify('Successfully updated');
    }, (response) => {
      let message;

      const responseIsObject = typeof response.data === 'object' && response.data !== null;
      const hasZeroOrManyFaces = response.data.error === 'selfieLength';

      if (responseIsObject && hasZeroOrManyFaces) {
        message = response.data.length === 0 ? 'Sorry, we could not find any faces in your photo' : 'Sorry, we detected more than 1 face in your photo';
      } else {
        message = 'Unable to update';
      }

      this.uiService.notify(message);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

UpdateAccountController.$inject = ['$window', '$q', '$scope', 'Auth0Service', 'StorageService', 'UserService', 'UIService'];
