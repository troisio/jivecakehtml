export default class ConnectionService {
  constructor($http, settings, ClientConnection, toolsService, auth0Service) {
    this.$http = $http;
    this.ClientConnection = ClientConnection;
    this.toolsService = toolsService;
    this.auth0Service = auth0Service;
    this.settings = settings;

    this.eventSources = {};
  }

  getEventSource(token, user_id) {
    const userHasEventSource = user_id in this.eventSources;

    if (!userHasEventSource) {
      let  source;

      if ('EventSource' in window) {
        source = new EventSource(this.settings.jivecakeapi.uri + '/notification?Authorization=Bearer ' + token);
      } else {
        source = {
          addEventListener: function() {
          },
          close: function() {
          }
        };
      }

      this.eventSources[user_id] = source;
    }

    return this.eventSources[user_id];
  }

  deleteEventSources() {
    for (let key in this.eventSources) {
      delete this.eventSources[key];
    }
  }

  closeEventSources () {
    for (let key in this.eventSources) {
      const source = this.eventSources[key];
      source.close();
    }
  }

  getSse(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'connection', 'sse'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }
}

ConnectionService.$inject = ['$http', 'settings', 'ClientConnection', 'ToolsService', 'Auth0Service'];