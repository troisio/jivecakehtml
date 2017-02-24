export default class AssetService {
  constructor($window, $http, settings) {
    this.$window = $window;
    this.$http = $http;
    this.settings = settings;
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'asset'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => response.data);
  }

  getUserType() {
    return 0;
  }

  getImgurAssetType() {
    return 0;
  }

  getUserImages(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'asset'].join('/');

    params.entityType = this.getUserType();
    params.assetType = this.getImgurAssetType();

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      response.data.forEach((asset) => {
        asset.data = this.$window.JSON.parse(this.$window.atob(asset.data));
      });

      return response.data;
    });
  }
}

AssetService.$inject = ['$window', '$http', 'settings'];