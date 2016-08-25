export default class NotificationService {
  constructor(angular, $window, $http, settings) {
    this.angular = angular;
    this.$window = $window;
    this.$http = $http;
    this.settings = settings;
  }

  send(token, chunk, params) {
    const url = [this.settings.jivecakeapi.uri, 'notification'].join('/');
    const copy = {
      id: chunk.id,
      name: chunk.name,
      data: this.$window.JSON.stringify(chunk.data),
      comment: chunk.comment
    };

    return this.$http.post(url, copy, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }
}

NotificationService.$inject = ['angular', '$window', '$http', 'settings'];