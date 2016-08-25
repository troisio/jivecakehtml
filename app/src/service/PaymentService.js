export default class PaymentService {
  constructor($http, toolsService, settings, SubscriptionPaymentDetail) {
    this.$http = $http;
    this.toolsService = toolsService;
    this.SubscriptionPaymentDetail = SubscriptionPaymentDetail;
  }

  createSubscriptionDetail(token, organizationId, detail) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'payment', 'detail'].join('/');

    return this.$http.post(url, detail, {
      headers : {
        Authorization : 'Bearer ' + token
      }
    }).then((response) => {
      return this.toolsService.toObject(response.data, this.SubscriptionPaymentDetail);
    });
  }
}

PaymentService.$inject = [
  '$http',
  'ToolsService',
  'settings',
  'SubscriptionPaymentDetail'
];