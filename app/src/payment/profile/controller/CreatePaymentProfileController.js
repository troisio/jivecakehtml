import URLSearchParams from 'url-search-params';

export default class CreatePaymentProfileController {
  constructor(
    $state,
    $scope,
    $mdDialog,
    settings,
    paymentProfileService,
    storageService,
    uiService,
    PaypalPaymentProfile,
    organization
  ) {
    this.$state = $state;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.settings = settings;
    this.paymentProfileService = paymentProfileService;
    this.storageService = storageService;
    this.uiService = uiService;
    this.PaypalPaymentProfile = PaypalPaymentProfile;
    this.organization = organization;

    this.$scope.type = 'stripe';
    this.$scope.hasStripeAccount = true;
    this.$scope.loading = false;
    this.run();
  }

  run() {
    this.$scope.organization = this.organization;
    this.$scope.profile = new this.PaypalPaymentProfile();
    this.$scope.close = this.$mdDialog.hide;
  }

  submit(type) {
    this.$scope.loading = true;

    if (type === 'paypal') {
      this.$scope.loading = true;

      const storage = this.storageService.read();
      this.paymentProfileService.createPaypalPaymentProfile(
        storage.auth.idToken,
        this.organization.id,
        this.$scope.profile
      ).then(() => {
        this.uiService.notify('Payment Profile created');
        this.$mdDialog.hide();
      }, () => {
        this.uiService.notify('Unable to create payment profile');
      }).finally(() => {
        this.$scope.loading = false;
      });
    } else if (type === 'stripe') {
      const params = new URLSearchParams();
      params.append('response_type', 'code');
      params.append('scope', 'read_write');
      params.append('client_id', this.settings.oauth.stripe.client_id);
      params.append('redirect_uri', location.origin + '/oauth/redirect');
      params.append('always_prompt', true);
      params.append('state', JSON.stringify({
        name: this.$state.current.name,
        stateParams: this.$state.params,
        flow: 'stripe',
        subject: this.organization.id
      }));

      if (this.$scope.hasStripeAccount) {
        params.append('stripe_landing', 'login');
      } else {
        const storage = this.storageService.read();

        params.append('stripe_landing', 'register');
        params.append('stripe_user[email]', storage.profile.email);
      }

      location.href = 'https://connect.stripe.com/oauth/authorize?' + params.toString();
    } else {
      throw new Error('type is not stripe or paypal');
    }
  }
}

CreatePaymentProfileController.$inject = [
  '$state',
  '$scope',
  '$mdDialog',
  'settings',
  'PaymentProfileService',
  'StorageService',
  'UIService',
  'PaypalPaymentProfile',
  'organization'
];
