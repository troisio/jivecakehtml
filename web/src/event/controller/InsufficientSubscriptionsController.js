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
    onSubscribe,
    onSubscribeAttempt
  ) {
    this.$mdDialog = $mdDialog;
    this.uiService = uiService;
    this.storageService = storageService;
    $scope.subscriptions = subscriptions;
    $scope.organization = organization;
    this.stripeService = stripeService;
    this.subscriptionId = subscriptionId;
    this.onSubscribe = onSubscribe;
    this.onSubscribeAttempt = onSubscribeAttempt;

    $scope.subscriptionId = subscriptionId;
  }

  subscribe(organization) {
    this.$mdDialog.hide();

    const description = this.subscriptionId === this.stripeService.MONTHLY_TRIAL_ID ?
      '$10 Monthly Subscription (Trial)' : '$10 Monthly Subscription';
    this.stripeService.showStripeMonthlySubscription({
      description: description
    }).then((token) => {
      this.onSubscribeAttempt();
      const storage = this.storageService.read();

      this.stripeService.subscribe(
        storage.auth.accessToken,
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
  'onSubscribe',
  'onSubscribeAttempt'
];