export default class Auth0Service {
  constructor($http, settings) {
    this.$http = $http;
    this.settings = settings;
  }

  updateUser(token, user_id, body) {
    const url = [this.settings.jivecakeapi.uri, 'auth0/api/v2/users', user_id].join('/');

    return this.$http.patch(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  sendVerificationEmail(token, body) {
    const url = [this.settings.jivecakeapi.uri, 'auth0/api/v2/jobs/verification-email'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => response.data);
  }
}

Auth0Service.$inject = ['$http', 'settings'];