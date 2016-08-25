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
    }).then(function(response) {
      return response.data;
    });
  }

  searchUsers(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'auth0/api/v2/users'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  getUser(token, user_id) {
    const url = [this.settings.jivecakeapi.uri, 'auth0/api/v2/users', user_id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return response.data;
    });
  }

  sendVerificationEmail(token, body) {
    const url = [this.settings.jivecakeapi.uri, 'auth0/api/v2/jobs/verification-email'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return response.data;
    });
  }
}

Auth0Service.$inject = ['$http', 'settings'];