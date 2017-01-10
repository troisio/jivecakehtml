export default class UserService {
  constructor($http, settings) {
    this.$http = $http;
    this.settings = settings;
  }

  uploadSelfie(token, user_id, data, contentType) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'selfie'].join('/');

    return this.$http.post(url, data, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': contentType
      },
      transformRequest: []
    }).then(response => response.data);
  }
}

UserService.$inject = ['$http', 'settings'];