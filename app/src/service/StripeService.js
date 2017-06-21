export default class StripeService {
  constructor($q, $http, settings) {
    this.$q = $q;
    this.$http = $http;
    this.settings = settings;
  }

  subscribe(token, organizationId, body) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', organizationId, 'subscribe'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  cancelSubscription(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', 'subscriptions', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    });
  }

  showStripeMonthlySubscription() {
    const defer = this.$q.defer();

    const checkout = StripeCheckout.configure({
      name: 'JiveCake',
      key: this.settings.stripe.pk,
      image: 'assets/safari/apple-touch-120x120.png',
      locale: 'auto',
      currency: 'USD',
      token: function(token) {
        defer.resolve(token);
      },
      closed: function () {
        defer.reject();
      }
    });

    checkout.open({
      name: 'JiveCake',
      description: '$10 Monthly Subscription',
      amount: 1000
    });

    return defer.promise;
  }

  getSubscriptions(token, organizationId) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', organizationId, 'subscription'].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => response.data);
  }
}

StripeService.$inject = ['$q', '$http', 'settings'];