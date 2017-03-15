export default class PaypalService {
  constructor($window, $http, settings, itemService, transactionService) {
    this.$window = $window;
    this.$http = $http;
    this.settings = settings;
    this.itemService = itemService;
    this.transactionService = transactionService;
  }

  searchIpn(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', 'ipn'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  submitIpn(token, ipn, type) {
    const parts = [];

    for(let key in ipn) {
      const value = ipn[key];
      let part = this.$window.encodeURIComponent(key) + '=';

      const validValue = typeof value !== 'undefined' && value !== null;

      if (validValue) {
        part += this.$window.encodeURIComponent(value);
      }

      parts.push(part);
    }

    const data = parts.join('&');
    const url = [this.settings.jivecakeapi.uri, 'paypal', 'ipn', type].join('/');

    return this.$http({
      method: 'POST',
      url: url,
      data: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + token
      }
    });
  }

  createPaymentDetails(token) {
    const url = [this.settings.jivecakeapi.uri, 'paypal', 'detail'].join('/');

    const headers = {};

    if (typeof token !== 'undefined') {
      headers.Authorization = 'Bearer ' + token;
    }

    return this.$http({
      method: 'POST',
      url: url,
      headers: headers
    }).then(function(response) {
      return response.data;
    });
  }

  getCartIpn(itemQuantities, time, currency, txn_id, payment_status, pending_reason, custom) {
    const timestamp = new this.$window.Date(time).getTime();
    const components = new Date(time).toGMTString().split(' ');
    const day = components[1],
      month = components[2],
      year = components[3],
      time24 = components[4],
      zone = components[5];
    const paymentdate = [
      [time24, month, day].join(' '),
      [year, zone].join(' ')
    ].join(', ');

    const ipn = {
      num_cart_items: itemQuantities.length.toString(),
      receiver_email: 'email@email.com',
      payer_status: 'unverified',
      transaction_subject: '',
      address_status: 'confirmed',
      residence_country: 'US',
      protection_eligibility: 'Eligible',
      verify_sign: 'AWu5LXYeGjbN4MnftcnMN965XXlkAlEp6Ip2YzXnNcdwFbPEku367GyJ',
      payment_date: paymentdate,
      mc_handling: '0.00',
      mc_handling1: '0.00',
      receipt_id: '3182-9931-5036-3737',
      tax: '0.00',
      payment_type: 'instant',
      address_street: 'Address Line 1',
      payer_id: '7F6BV9XY5WCNE',
      address_zip: '32792',
      mc_gross: '',
      ipn_track_id: '82524d84a53f6',
      charset: 'windows-1252',
      payer_email: 'email@email.com',
      address_country_code : 'US',
      receiver_id: 'J6LQ63LX6CYF8',
      address_state: 'FL',
      address_name: 'Address Name',
      txn_id: txn_id,
      mc_shipping: '0.00',
      pending_reason: pending_reason,
      payment_gross: '',
      first_name: 'FirstName',
      business: 'email@email.com',
      address_country: 'United States',
      payment_status: payment_status,
      custom: custom,
      last_name: 'Last Name',
      notify_version: '3.8',
      mc_currency: currency,
      address_city: 'Winter Park',
      txn_type: 'cart'
    };

    const items = itemQuantities.map(subject => subject.item);

    return this.itemService.getDerivedAmounts(items, this.transactionService).then((amounts) => {
      let mc_gross = 0;

      for (let index = 0; index < itemQuantities.length; index++) {
        const itemQuantity = itemQuantities[index];
        const itemIndex = index + 1;
        const amount = amounts[index];

        mc_gross += amount;

        ipn['mc_gross_' + itemIndex] = this.$window.parseFloat(Math.round(amount * 100) / 100).toFixed(2) * itemQuantity.quantity;
        ipn['item_name' + itemIndex] = itemQuantity.item.name;
        ipn['mc_shipping' + itemIndex] = 0.0;
        ipn['mc_handling' + itemIndex] = 0.0;
        ipn['item_number' + itemIndex] = itemQuantity.item.id;
        ipn['quantity' + itemIndex] = itemQuantity.quantity;
        ipn['tax' + itemIndex] = 0.0;
      }

      ipn.mc_gross = mc_gross;

      return ipn;
    });
  }

  getTrialSubscriptionIpn() {
    return {
      txn_id: null,
      parent_txn_id: null,
      payer_email: 'payper@pay.com',
      receiver_email: 'user@website.com',
      business: 'user@website.com',
      item_number: null,
      mc_gross: null,
      mc_gross1: null,
      protection_eligibility: null,
      payer_id: "4FK8LGP9AUH22",
      query_track_id: null,
      payment_date: null,
      payment_status: null,
      pending_reason: null,
      reason_code: null,
      charset: "windows-1252",
      first_name: "firstname",
      address_name: "",
      address_street: "123 Fake Street",
      address_city: "city",
      address_state: "FL",
      address_zip: "02112",
      address_country: "United States",
      address_country_code: "US",
      address_status: "confirmed",
      mc_fee: null,
      mc_handling: null,
      mc_handling1: null,
      mc_shipping: null,
      mc_shipping1: null,
      invoice: null,
      tax: null,
      notify_version: "3.8",
      custom: null,
      payer_status: "verified",
      payer_business_name: null,
      quantity: null,
      verify_sign: null,
      payment_type: null,
      btn_id: "128724092",
      last_name: "Chau",
      payment_fee: null,
      shipping_discount: null,
      insurance_amount: null,
      receiver_id: null,
      txn_type: "subscr_signup",
      item_name: "Test",
      item_name1: null,
      quantity1: null,
      item_number1: null,
      discount: null,
      mc_currency: "USD",
      residence_country: "US",
      handling_amount: null,
      shipping_method: null,
      transaction_subject: null,
      payment_gross: null,
      shipping: null,
      ipn_track_id: "",
      test_ipn: null,
      for_auction: null,
      receipt_id: null,
      settle_amount: null,
      settle_currency: null,
      exchange_rate: null,
      subscr_date: "07:02:12 Jan 11, 2017 PST",
      amount1: "0.00",
      amount2: null,
      amount3: "30.00",
      period1: "1 M",
      period2: null,
      period3: "1 M",
      recurring: "1",
      mc_amount1: "0.00",
      mc_amount2: null,
      mc_amount3: "0.01",
      reattempt: "1",
      subscr_id: "",
      timeCreated: null
    };
  }

  getVerified() {
    return 'VERIFIED';
  }

  getSupportedPaymentCodes() {
    return ['USD', 'EUR'];
  }

  getMonthlyEvent1HostedButtonId() {
    return '7BVYJDC7CTPYG';
  }

  getMonthlyEvent30HostedButtonId() {
    return 'MJYREQW5VGGVU';
  }
}

PaypalService.$inject = ['$window', '$http', 'settings', 'ItemService', 'TransactionService'];