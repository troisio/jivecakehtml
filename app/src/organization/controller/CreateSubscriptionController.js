export default class CreateSubscriptionController {
  constructor($timeout, $location, $window, $rootScope, $scope, storageService, organizationService, uiService, paypalService, subscriptionService, settings, SubscriptionPaymentDetail, user, organization) {
    this.$timeout = $timeout;
    this.$location = $location;
    this.$window = $window;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.paypalService = paypalService;
    this.subscriptionService = subscriptionService;
    this.settings = settings;
    this.SubscriptionPaymentDetail = SubscriptionPaymentDetail;
    this.user = user;
    this.organization = organization;

    this.storage = storageService.read();
    this.$scope.organization = organization;
    this.$scope.$window = $window;
    this.$scope.custom = '';
    this.$scope.amount = subscriptionService.getMonthlySubscriptionRate();
  }

  subscribe($event) {
    $event.preventDefault();

    const loader = this.uiService.load();
    const mock = this.settings.paypal.mock;

    const detail = new this.SubscriptionPaymentDetail();
    detail.organizationId = this.organization.id;
    detail.user_id = this.user.user_id;

    this.organizationService.createSubscriptionPaymentDetail(this.storage.token, this.organization.id, detail).then((detail) => {
      if (mock) {
        const ipn = this.paypalService.getTrialSubscriptionIpn();
        ipn.amount3 = this.subscriptionService.getMonthlySubscriptionRate().toString();
        ipn.custom = detail.custom;
        ipn.txn_id = this.$window.Math.random().toString(36).slice(2);

        return this.paypalService.submitIpn(this.storage.token, ipn, this.paypalService.getVerified()).then((response) => {
          loader.dialog.finally(() => {
            this.uiService.notify('Subscription created');
          });

          loader.dialog.finally(() => {
            this.$rootScope.$broadcast('SUBSCRIPTION.CREATED', response);
          });
        }, () => {
          loader.dialog.finally(() => {
            this.uiService.notify('Unable to subscribe');
          });
        });
      } else {
        const form = $event.target;
        this.$scope.custom = detail.custom;

        this.$timeout(function() {
          form.submit();
        });
      }
    }).finally(() => {
      if (mock)  {
        loader.close.resolve();
      }
    });
  }
}

CreateSubscriptionController.$inject = ['$timeout', '$location', '$window', '$rootScope', '$scope', 'StorageService', 'OrganizationService', 'UIService', 'PaypalService', 'SubscriptionService', 'settings', 'SubscriptionPaymentDetail', 'user', 'organization'];