export default class NotificationService {
  constructor($http, settings) {
    this.$http = $http;
    this.settings = settings;
  }

  send(token, chunk, params) {
    const url = [this.settings.jivecakeapi.uri, 'notification'].join('/');
    const copy = {
      id: chunk.id,
      name: chunk.name,
      data: JSON.stringify(chunk.data),
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

NotificationService.$inject = ['$http', 'settings'];