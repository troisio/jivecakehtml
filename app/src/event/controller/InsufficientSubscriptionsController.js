export default class InsufficientSubscriptionsController {
  constructor($scope, $mdDialog, uiService, $state, storageService, subscriptions, organization, stripeService) {
    this.$mdDialog = $mdDialog;
    this.uiService = uiService;
    this.$state = $state;
    this.storageService = storageService;
    $scope.subscriptions = subscriptions;
    $scope.organization = organization;
    this.stripeService = stripeService;
  }

  subscribe(organization) {
    this.$mdDialog.hide();

    this.stripeService.showStripeMonthlySubscription().then((token) => {
      const storage = this.storageService.read();

      this.stripeService.subscribe(storage.auth.idToken, organization.id, {
        email: token.email,
        source: token.id
      }).then((response) => {
        this.uiService.notify('Sucessfully added subscription');
      }, () => {
        this.uiService.notify('Unable to subcribe');
      });
    });
  }
}

InsufficientSubscriptionsController.$inject = ['$scope', '$mdDialog', 'UIService', '$state', 'StorageService', 'subscriptions', 'organization', 'StripeService'];