export default class OAuthRedirectController {
  constructor($state, $q, paymentProfileService, storageService) {
    this.$state = $state;
    this.$q = $q;
    this.paymentProfileService = paymentProfileService;
    this.storageService = storageService;
    this.run();
  }

  run() {
    let state;

    try {
      state = JSON.parse(this.$state.params.state);
    } catch (e) {
      state = null;
    }

    if (state !== null && state.flow === 'stripe') {
      let future;

      if (this.$state.params.code === null) {
        future = this.$q.resolve();
      } else {
        const storage = this.storageService.read();
        future = this.paymentProfileService.createStripePaymentProfile(storage.auth.idToken, state.subject, {
          code: this.$state.params.code
        });
      }

      this.$state.go(state.name, state.stateParams);
    }
  }
}

OAuthRedirectController.$inject = ['$state', '$q', 'PaymentProfileService', 'StorageService'];