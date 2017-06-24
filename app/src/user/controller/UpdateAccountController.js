import angular from 'angular';

export default class UpdateAccountController {
  constructor($q, $scope, auth0Service, storageService, userService, uiService, assetService) {
    this.$q = $q;
    this.$scope = $scope;
    this.auth0Service = auth0Service;
    this.storageService = storageService;
    this.userService = userService;
    this.uiService = uiService;
    this.assetService = assetService;

    this.$scope.uiReady = false;
    $scope.$parent.showTabs = false;
    $scope.assets = [];
    $scope.croppedImage = '';
    $scope.image = null;
    $scope.showCroppingDiv = false;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then(() => {
      const storage = this.storageService.read();

      const userFuture = this.auth0Service.getUser(storage.auth.idToken, storage.auth.idTokenPayload.sub).then((user) => {
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
      });

      const assetFuture = this.assetService.search(storage.auth.idToken, {
        assetType: this.assetService.GOOGLE_CLOUD_STORAGE_BLOB_FACE,
        entityId: storage.auth.idTokenPayload.sub,
        entityType: this.assetService.USER,
        order: '-timeCreated',
        limit: 1
      }).then((assets) => {
        this.$scope.assets = assets;
      }, () => {
        this.uiService.notify('Unable to get asset information');
      });

      this.$q.all([userFuture, assetFuture]).finally(() => {
        this.$scope.uiReady = true;
      });
    });

    angular.element(document.querySelector('[name=photo]')).on('change', (e) => {
      const file = e.currentTarget.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.$scope.$apply(() => {
          this.$scope.image = e.target.result;
          this.$scope.showCroppingDiv = true;
        });
      };

      reader.readAsDataURL(file);

    });
  }

  submit(user) {
    const storage = this.storageService.read();
    let imageFuture;

    if (this.$scope.croppedImage === '') {
      imageFuture = this.$q.resolve();
    } else {
      const index = this.$scope.croppedImage.indexOf(';base64,') + ';base64,'.length;
      const base64 = this.$scope.croppedImage.substring(index);
      const raw = atob(base64);
      const data = new Uint8Array(new ArrayBuffer(raw.length));

      for(let index = 0; index < raw.length; index++) {
        data[index] = raw.charCodeAt(index);
      }

      const sliceStart = this.$scope.croppedImage.indexOf(':') + 1;
      const sliceEnd = this.$scope.croppedImage.indexOf(';');
      const type = this.$scope.croppedImage.substring(sliceStart, sliceEnd);

      imageFuture = this.userService.uploadSelfie(
        storage.auth.idToken,
        storage.auth.idTokenPayload.sub,
        data,
        type
      );
    }

    let userUpdateFuture;

    if (!this.$scope.isIdentityProviderAccount) {
      this.$scope.loading = true;
      let body = {
        email: user.email,
        user_metadata: {
          given_name: user.given_name,
          family_name: user.family_name
        }
      };

      userUpdateFuture = this.auth0Service.updateUser(
        storage.auth.idToken,
        storage.auth.idTokenPayload.sub,
        body
      ).then(() => {
      });
    } else {
      userUpdateFuture = this.$q.resolve();
    }

    this.$scope.loading = true;

    this.$q.all([imageFuture, userUpdateFuture]).then(() => {
      this.uiService.notify('Successfully updated');
      this.run();
    }, (response) => {
      if  (typeof response.data === 'object' && response.data.error === 'face') {
        if (response.data.data.annotationsCount === 1) {
          this.uiService.notify("Sorry, please upload a higher quality photo");
        } else {
          const message = response.data.data.annotationsCount === 0 ? 'Sorry, we could not find any faces in your photo' : 'Sorry, we found more than 1 face in your photo';
          this.uiService.notify(message);
        }
      }
    }).finally(() => {
      this.$scope.loading = false;
      this.reset();
    });
  }

  reset() {
    this.$scope.showCroppingDiv = false;
    this.$scope.image = null;
    document.querySelector('[name=photo]').value = '';
  }
}

UpdateAccountController.$inject = ['$q', '$scope', 'Auth0Service', 'StorageService', 'UserService', 'UIService', 'AssetService'];
