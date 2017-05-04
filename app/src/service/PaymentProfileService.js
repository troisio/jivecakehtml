export default class PaymentProfileService {
  constructor($http, $q, settings, toolsService, PaymentProfile, PaypalPaymentProfile) {
    this.$http = $http;
    this.$q = $q;
    this.settings = settings;
    this.toolsService = toolsService;
    this.PaymentProfile = PaymentProfile;
    this.PaypalPaymentProfile = PaypalPaymentProfile;

    this.paypalPaymentProfileFields = Object.keys(new this.PaypalPaymentProfile());
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile'].join('/');

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

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile', 'search'].join('/');

    return this.$http.get(url, {
      params: params
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  create(token, profile) {
    const url = [this.settings.jivecakeapi.uri, 'organization', profile.organizationId, 'payment', 'profile', 'paypal'].join('/');

    return this.$http.post(url, profile, {
      headers : {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  delete(token, paymentProfileId) {
    const url = [this.settings.jivecakeapi.uri, 'payment', 'profile', paymentProfileId].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getImplementation(data) {
    return 'email' in data ? this.PaypalPaymentProfile : null;
  }

  toObject(subject) {
    const implementation = this.getImplementation(subject);
    const result = this.toolsService.toObject(subject, implementation);
    return result;
  }
}

PaymentProfileService.$inject = ['$http', '$q', 'settings', 'ToolsService', 'PaymentProfile', 'PaypalPaymentProfile'];