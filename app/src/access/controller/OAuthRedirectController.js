export default class OAuthRedirectController {
  constructor($scope, $state, $q, paymentProfileService, storageService) {
    this.$scope = $scope;
    this.$state = $state;
    this.$q = $q;
    this.paymentProfileService = paymentProfileService;
    this.storageService = storageService;

    this.$scope.$parent.$parent.ready.then(() => this.run());
  }

  run() {
    let state;

    try {
      state = JSON.parse(this.$state.params.state);
    } catch (e) {
      state = null;
    }

    if (state !== null && state.flow === 'stripe') {
      if (this.$state.params.code === null) {
        this.$q.resolve();
      } else {
        const storage = this.storageService.read();
        this.paymentProfileService.createStripePaymentProfile(storage.auth.idToken, state.subject, {
          code: this.$state.params.code
        });
      }

      this.$state.go(state.name, state.stateParams);
    }
  }
}

OAuthRedirectController.$inject = ['$scope', '$state', '$q', 'PaymentProfileService', 'StorageService'];