export default class PaymentProfileService {
  constructor($http, $q, settings, toolsService, PaypalPaymentProfile, StripePaymentProfile) {
    this.$http = $http;
    this.$q = $q;
    this.settings = settings;
    this.toolsService = toolsService;
    this.PaypalPaymentProfile = PaypalPaymentProfile;
    this.StripePaymentProfile = StripePaymentProfile;
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile', 'search'].join('/');

    return this.$http.get(url, {
      params: params
    }).then(response => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  createPaypalPaymentProfile(token, profile) {
    const url = [this.settings.jivecakeapi.uri, 'organization', profile.organizationId, 'payment', 'profile', 'paypal'].join('/');

    return this.$http.post(url, profile, {
      headers : {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  createStripePaymentProfile(token, organizationId, body) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'payment', 'profile', 'stripe'].join('/');

    return this.$http.post(url, body, {
      headers : {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  delete(token, paymentProfileId) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile', paymentProfileId].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toObject(response.data));
  }

  getImplementation(data) {
    let result;

    if (data.hasOwnProperty('stripe_publishable_key')) {
      result = this.StripePaymentProfile;
    } else if (data.hasOwnProperty('email')) {
      result = this.PaypalPaymentProfile;
    } else {
      throw new Error('PaymentProfile has invalid implementation');
    }

    return result;
  }

  toObject(subject) {
    const implementation = this.getImplementation(subject);
    return this.toolsService.toObject(subject, implementation);
  }
}

PaymentProfileService.$inject = ['$http', '$q', 'settings', 'ToolsService', 'PaypalPaymentProfile', 'StripePaymentProfile'];