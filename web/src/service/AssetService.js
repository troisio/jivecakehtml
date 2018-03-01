import URLSearchParams from 'url-search-params';

export default class AssetService {
  constructor($http, settings) {
    this.$http = $http;
    this.settings = settings;

    this.USER_TYPE = 0;
    this.ORGANIZATION_TYPE = 1;

    this.GOOGLE_CLOUD_STORAGE_BLOB_FACE = 0;
    this.GOOGLE_CLOUD_STORAGE_CONSENT_PDF = 1;
    this.ORGANIZATION_CONSENT_TEXT = 2;
  }

  search(token, query) {
    const params = new URLSearchParams();

    for (let key in query) {
      const value = query[key];
      const values = Array.isArray(value) ? value : [value];
      for (let value of values) {
        params.append(key, value);
      }
    }

    return fetch(`${this.settings.jivecakeapi.uri}/asset?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
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

  createConsentAsset(token, id, body) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id, 'consent'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  getOrganizationConsentAssets(token, params) {
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

  delete(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'asset', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }
}

AssetService.$inject = ['$http', 'settings'];