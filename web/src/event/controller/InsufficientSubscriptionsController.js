export default class InsufficientSubscriptionsController {
  constructor(
    $scope,
    $mdDialog,
    uiService,
    storageService,
    subscriptions,
    organization,
    stripeService,
    subscriptionId,
    onSubscribe
  ) {
    this.$mdDialog = $mdDialog;
    this.uiService = uiService;
    this.storageService = storageService;
    $scope.subscriptions = subscriptions;
    $scope.organization = organization;
    this.stripeService = stripeService;
    this.subscriptionId = subscriptionId;
    this.onSubscribe = onSubscribe;

    $scope.subscriptionId = subscriptionId;
  }

  subscribe(organization) {
    this.$mdDialog.hide();

    const description = this.subscriptionId === this.stripeService.MONTHLY_TRIAL_ID ?
      '$10 Monthly Subscription, (1st Month Free)' : '$10 Monthly Subscription';
    this.stripeService.showStripeMonthlySubscription({
      description: description
    }).then((token) => {
      const storage = this.storageService.read();

      this.stripeService.subscribe(
        storage.auth.idToken,
        organization.id,
        this.subscriptionId,
        {
          email: token.email,
          source: token.id
        }
      ).then((data) => {
        this.onSubscribe(data);
        this.uiService.notify('Sucessfully added subscription');
      }, () => {
        this.uiService.notify('Unable to subscribe');
      });
    });
  }
}

InsufficientSubscriptionsController.$inject = [
  '$scope',
  '$mdDialog',
  'UIService',
  'StorageService',
  'subscriptions',
  'organization',
  'StripeService',
  'subscriptionId',
  'onSubscribe'
];