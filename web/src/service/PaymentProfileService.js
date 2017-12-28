import PaypalPaymentProfile from '../class/PaypalPaymentProfile';
import StripePaymentProfile from '../class/StripePaymentProfile';

export default class PaymentProfileService {
  constructor($http, settings, toolsService) {
    this.$http = $http;
    this.settings = settings;
    this.toolsService = toolsService;
  }

  createPaypalPaymentProfile(token, organizationId, profile) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'payment', 'profile', 'paypal'].join('/');

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
      result = StripePaymentProfile;
    } else if (data.hasOwnProperty('email')) {
      result = PaypalPaymentProfile;
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

PaymentProfileService.$inject = ['$http', 'settings', 'ToolsService'];