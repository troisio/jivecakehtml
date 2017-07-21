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
    const url = [this.settings.jivecakeapi.uri, 'event', id, 'aggregated'].join('/');
    const options = {};

    if (token !== null) {
      options.headers = {
        Authorization: 'Bearer ' + token
      };
    }

    return this.$http.get(url, options).then(response => {
      response.data.organization = this.toolsService.toObject(response.data.organization, this.Organization);
      response.data.event = this.toolsService.toObject(response.data.event, this.Event);
      response.data.itemData.forEach(itemDatum => {
        itemDatum.item = this.toolsService.toObject(itemDatum.item, this.Item);
      });

      if (response.data.profile !== null) {
        response.data.profile = this.paymentProfileService.toObject(response.data.profile);
      }

      return response.data;
    });
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
        entity: response.data.entity.map((event) => {
          return this.toolsService.toObject(event, this.Event);
        }),
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
    }).then(response => {
      return {
        entity: response.data.entity.map((event) => {
          return this.toolsService.toObject(event, this.Event);
        }),
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
