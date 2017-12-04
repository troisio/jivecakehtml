import URLSearchParams from 'url-search-params';

export default class StripeService {
  constructor($q, $http, settings) {
    this.$q = $q;
    this.$http = $http;
    this.settings = settings;

    this.MONTHLY_ID = 'monthly10';
    this.MONTHLY_TRIAL_ID = 'monthly10trial';
  }

  getMonthlySubscriptionId(token, user, organizationId) {
    const queries = [
      {
        organizationId: organizationId,
        plan: this.MONTHLY_TRIAL_ID,
        status: 'all'
      },
      {
        email: user.email,
        plan: this.MONTHLY_TRIAL_ID,
        status: 'all'
      },
      {
        email: user.email,
        plan: this.MONTHLY_TRIAL_ID,
        status: 'all'
      }
    ];

    const futures = queries.map(query => this.searchSubscriptions(token, query));

    return Promise.all(futures).then((resolve) => {
      const subscriptions = [];

      for (let array of resolve) {
        subscriptions.push(...array);
      }

      let hasFreeSubscription = false;

      for (let subscription of subscriptions) {
        if (subscription.plan.id === this.MONTHLY_TRIAL_ID) {
          hasFreeSubscription = true;
          break;
        }
      }

      return hasFreeSubscription ? this.MONTHLY_ID : this.MONTHLY_TRIAL_ID;
    });
  }

  refund(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', id, 'refund'].join('/');

    return this.$http.post(url, null, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  order(token, eventId, body) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', eventId, 'order'].join('/');

    return this.$http.post(url, body, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then(response => response.data);
  }

  subscribe(token, organizationId, planId, body) {
    const url = `${this.settings.jivecakeapi.uri}/stripe/${organizationId}/subscribe/${planId}`;

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  getOrganizationTrialingOrActiveSubscriptions(token, organizationId) {
    const queries = [
      {
        organizationId: organizationId,
        plan: this.MONTHLY_ID,
        status: 'active'
      },
      {
        organizationId: organizationId,
        plan: this.MONTHLY_TRIAL_ID,
        status: 'active'
      },
      {
        organizationId: organizationId,
        plan: this.MONTHLY_TRIAL_ID,
        status: 'trialing'
      }
    ];

    const futures = queries.map(query => this.searchSubscriptions(token, query));
    return Promise.all(futures).then((resolve) => {
      const result = [];
      const idSet = new Set();

      for (let array of resolve) {
        for (let subscription of array) {
          if (!idSet.has(subscription.id)) {
            result.push(subscription);
            idSet.add(subscription.id);
          }
        }
      }

      return result;
    });
  }

  cancelSubscription(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'stripe', 'subscriptions', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization : 'Bearer ' + token
      }
    });
  }

  showStripeMonthlySubscription(displayOptions) {
    const defer = this.$q.defer();

    const checkout = StripeCheckout.configure({
      name: 'JiveCake',
      key: this.settings.stripe.pk,
      image: 'assets/safari/apple-touch-120x120.png',
      locale: 'auto',
      currency: 'USD',
      zipCode: true,
      token: function(token) {
        defer.resolve(token);
      },
      closed: function () {
        defer.reject();
      }
    });

    const options = Object.assign({
      name: 'JiveCake',
      description: '$10 Monthly Subscription',
      amount: 1000
    }, displayOptions);

    checkout.open(options);
    return defer.promise;
  }

  searchSubscriptions(token, query) {
    const params = new URLSearchParams();

    for (let key in query) {
      params.append(key, query[key]);
    }

    return fetch(`${this.settings.jivecakeapi.uri}/stripe/subscription?${params.toString()}`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }
}

StripeService.$inject = ['$q', '$http', 'settings'];