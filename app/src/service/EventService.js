export default class EventService {
  constructor($http, $q, itemService, settings, toolsService, Event) {
    this.$http = $http;
    this.$q = $q;
    this.itemService = itemService;
    this.settings = settings;
    this.toolsService = toolsService;
    this.Event = Event;
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'event', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => {
      return this.toObject(response.data);
    });
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'event', 'search'].join('/');

    return this.$http.get(url, {
      params: params,
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'event'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  create(token, organizationId, event) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'event'].join('/');

    return this.$http.post(url, event, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  update(token, event) {
    const url = [this.settings.jivecakeapi.uri, 'event', event.id].join('/');

    return this.$http.post(url, event, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  fieldUpdate(token, id, data) {
    return this.read(token, id).then((event) => {
      for (let key in data) {
        event[key] = data[key];
      }

      return this.update(token, event);
    });
  }

  delete(token, eventId) {
    const url = [this.settings.jivecakeapi.uri, 'event', eventId].join('/');
    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  getInactiveEventStatus() {
      return 0;
  }

  getActiveEventStatus() {
      return 1;
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Event);
  }
}

EventService.$inject = ['$http', '$q', 'ItemService', 'settings', 'ToolsService', 'Event'];
