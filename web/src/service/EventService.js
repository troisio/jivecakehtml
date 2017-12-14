export default class EventService {
  constructor($http, settings, toolsService, paymentProfileService, Organization, Event, Item) {
    this.$http = $http;
    this.settings = settings;
    this.toolsService = toolsService;
    this.paymentProfileService = paymentProfileService;
    this.Organization = Organization;
    this.Event = Event;
    this.Item = Item;
  }

  getAggregatedEventData(id, token) {
    return fetch(`${this.settings.jivecakeapi.uri}/event/${id}/aggregated`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then((data) => {
      data.organization = this.toolsService.toObject(data.organization, this.Organization);
      data.event = this.toolsService.toObject(data.event, this.Event);
      data.itemData.forEach(itemDatum => {
        itemDatum.item = this.toolsService.toObject(itemDatum.item, this.Item);
      });

      if (data.profile !== null) {
        data.profile = this.paymentProfileService.toObject(data.profile);
      }

      return data;
    });
  }

  getExcel(token, id) {
    return fetch(`${this.settings.jivecakeapi.uri}/event/${id}/excel`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'event', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Event));
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'event', 'search'].join('/');

    return this.$http.get(url, {
      params: params,
    }).then(response => {
      return {
        entity: response.data.entity.map((event) => this.toolsService.toObject(event, this.Event)),
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
    }).then(response => this.toolsService.toObject(response.data, this.Event));
  }

  update(token, event) {
    const url = [this.settings.jivecakeapi.uri, 'event', event.id].join('/');

    return this.$http.post(url, event, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Event));
  }

  fieldUpdate(token, id, data) {
    return this.read(token, id).then(event => {
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
    }).then(response => this.toolsService.toObject(response.data, this.Event));
  }

  getInactiveEventStatus() {
      return 0;
  }

  getActiveEventStatus() {
      return 1;
  }
}

EventService.$inject = ['$http', 'settings', 'ToolsService', 'PaymentProfileService', 'Organization', 'Event', 'Item'];
