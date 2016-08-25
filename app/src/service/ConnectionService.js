export default class ConnectionService {
  constructor($window, $http, settings, ClientConnection, toolsService, auth0Service) {
    this.$window = $window;
    this.$http = $http;
    this.ClientConnection = ClientConnection;
    this.toolsService = toolsService;
    this.auth0Service = auth0Service;
    this.settings = settings;

    this.clientConnectionFields = Object.keys(new ClientConnection());
    this.eventSources = {};
  }

  getEventSource(token, user_id) {
    return this.auth0Service.getUser(token, user_id).then((user) => {
      const userHasEventSource = user.user_id in this.eventSources;

      if (!userHasEventSource) {
        let  source;
        const browserHasEventSource = typeof this.$window.EventSource !== 'undefined';

        if (browserHasEventSource) {
          source = new this.$window.EventSource([
            this.settings.jivecakeapi.uri,
            'notification?Authorization=Bearer ' + token
          ].join('/'));
        } else {
          source = {
            addEventListener: function() {
            },
            close: function() {
            }
          };
        }

        this.eventSources[user.user_id] = source;
      }

      const result = this.eventSources[user.user_id];
      return result;
    });
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
    }).then(function(response) {
      return response.data;
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'connection'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObjects(response.data);
    });
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, ClientConnection);
  }

  toObjects(subject) {
    return subject.map(this.toObject, this);
  }
}

ConnectionService.$inject = ['$window', '$http', 'settings', 'ClientConnection', 'ToolsService', 'Auth0Service'];