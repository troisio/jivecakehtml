export default class CreateConsentAssetController {
  constructor($mdDialog, $timeout, $scope, uiService, assetService, storageService, organization, onAssetCreate, EntityAsset) {
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.uiService = uiService;
    this.assetService = assetService;
    this.storageService = storageService;
    this.organization = organization;
    this.onAssetCreate = onAssetCreate;

    this.byteLimit = 1000000;
    this.$scope.isText = false;
    this.fileContent = null;
    this.text = '';
    this.$scope.asset = new EntityAsset();
  }

  submit(isText, asset) {
    this.$scope.loading = true;
    const storage = this.storageService.read();

    let future;

    if (isText) {
      asset.assetType = this.assetService.ORGANIZATION_CONSENT_TEXT;
      asset.data = new Array(this.$scope.text.length);

      for (let i = 0; i < this.$scope.text.length; i++){
        asset.data[i] = this.$scope.text.charCodeAt(i);
      }

      future = Promise.resolve();
    } else {
      asset.data = this.fileContent;
      asset.assetType = this.assetService.GOOGLE_CLOUD_STORAGE_CONSENT_PDF;

      const file = document.querySelector('[name=consentPdf]').files[0];
      const reader = new FileReader();
      future = new Promise((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target.result.length > this.byteLimit) {
            reject();
          } else {
            const encoded = e.target.result;
            const index = encoded.indexOf(';base64,') + ';base64,'.length;
            const base64 = encoded.substring(index);
            const raw = atob(base64);
            const data = new Array(raw.length);

            for(let index = 0; index < raw.length; index++) {
              data[index] = raw.charCodeAt(index);
            }

            asset.data = data;
            resolve();
          }
        };
      });

      reader.readAsDataURL(file);
    }

    future.then(() => {
      return this.assetService.createConsentAsset(storage.auth.accessToken, this.organization.id, asset).then((asset) => {
        this.uiService.notify('Asset created');
        this.onAssetCreate(asset);
        this.$mdDialog.hide();
      }, () => {
        this.uiService.notify('Unable to create asset');
      }).then(() => {
        this.$scope.loading = false;
      });
    }, () => {
      this.uiService.notify('Files must be smaller than 1MB');
      this.$scope.loading = false;
      this.$timeout();
    });
  }
}

CreateConsentAssetController.$inject = [
  '$mdDialog',
  '$timeout',
  '$scope',
  'UIService',
  'AssetService',
  'StorageService',
  'organization',
  'onAssetCreate',
  'EntityAsset'
];