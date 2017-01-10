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
    const url = [this.settings.jivecakeapi.uri, 'paypal', 'ipn', type].join('/');
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

    return this.$http({
      method: 'POST',
      url: url,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  getSubscriptionPaymentIpn(override) {
    const result = {
      charset: "windows-1252",
      payer_email: "payer@test.com",
      receiver_email: "test@test.com",
      receiver_id: "J6LQ63LX6CYF8",
      payer_status: "verified",
      address_country_code: "US",
      item_number: "jivecakesubscriptiondailytest",
      address_state: "FL",
      transaction_subject: "JiveCake Test Daily Billing",
      address_name: "JiveCake",
      residence_country: "US",
      address_status: "confirmed",
      btn_id: "113215020",
      txn_id: "1GK360366M840293X",
      payment_gross: "1.00",
      protection_eligibility: "Eligible",
      verify_sign: "AVMnB4GuhH0hVL2g-AdOMvDUcA9zAUg7kdpqptp8Gk6j4BYE8RAVBX54",
      first_name: "Luis",
      payment_date: "19:52:50 Apr 14, 2016 PDT",
      business: "busines@test.com",
      address_country: "United States",
      custom: "5710574ba7b11b001f12fb19",
      payment_status: "Completed",
      last_name: "Banegas",
      item_name: "JiveCake Test Daily Billing",
      notify_version: "3.8",
      mc_currency: "USD",
      address_city: "Palm Bay",
      payment_type: "instant",
      txn_type: "subscr_payment",
      payer_business_name: "JiveCake",
      address_street: "131 Airview Avenue NE",
      subscr_id: "I-AGK5XHASMVX8",
      payment_fee: "0.33",
      payer_id: "J62KGRNQYR3VU",
      address_zip: "32907",
      mc_fee: "0.33",
      mc_gross: "1.00",
      ipn_track_id: "df33e24c1970d"
    };

    for (let key in override) {
      result[key] = override[key];
    }

    return result;
  }
/*
  This method needs to be refactored to support different quantities of the same item
*/
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