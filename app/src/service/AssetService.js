export default class AssetService {
  constructor($http, settings) {
    this.$http = $http;
    this.settings = settings;

    this.USER_TYPE = 0;
    this.GOOGLE_CLOUD_STORAGE_BLOB_FACE = 0;
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'asset'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  getUserType() {
    return 0;
  }

  getUserImages(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'asset'].join('/');

    params.entityType = this.USER_TYPE;
    params.assetType = this.GOOGLE_CLOUD_STORAGE_BLOB_FACE;

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }
}

AssetService.$inject = ['$http', 'settings'];