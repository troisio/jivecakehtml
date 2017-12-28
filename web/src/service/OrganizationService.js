import Organization from '../class/Organization';
import StripePaymentProfile from '../class/StripePaymentProfile';
import PaypalPaymentProfile from '../class/PaypalPaymentProfile';

export default class OrganizationService {
  constructor($window, $http, settings, eventService, permissionService, toolsService) {
    this.$window = $window;
    this.$http = $http;
    this.settings = settings;
    this.eventService = eventService;
    this.permissionService = permissionService;
    this.toolsService = toolsService;

    this.rootOrganization = new Organization();
    this.rootOrganization.id = '55865027c1fcce003aa0aa40';
    this.rootOrganization.name = "JiveCake";
    this.rootOrganization.email = "luis@trois.io";
  }

  getTree(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id, 'tree'].join('/');

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  getPaymentProfiles(token, organizationId) {
    const getImplementation = (data) => {
      let result;

      if (data.hasOwnProperty('stripe_publishable_key')) {
        result = StripePaymentProfile;
      } else if (data.hasOwnProperty('email')) {
        result = PaypalPaymentProfile;
      } else {
        throw new Error('PaymentProfile has invalid implementation');
      }

      return result;
    };

    return fetch(`${this.settings.jivecakeapi.uri}/organization/${organizationId}/payment/profile`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response))
      .then(profiles => {
        return profiles.map((profile) => {
          return this.toolsService.toObject(profile, getImplementation(profile));
        })
      });
  }

  delete(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, Organization));
  }

  create(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization'].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, Organization));
  }

  update(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organization.id].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, Organization));
  }

  read(id) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${id}`;
    return fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(data => this.toolsService.toObject(data, Organization));
  }

  getOrganizationsByUser(token, user_id, params) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'organization'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data.map(entity => this.toolsService.toObject(entity, Organization)));
  }

  getUsers(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${id}/user`;

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }
}

OrganizationService.$inject = ['$window', '$http', 'settings', 'EventService', 'PermissionService', 'ToolsService'];