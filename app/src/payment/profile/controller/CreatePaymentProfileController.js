export default class CreatePaymentProfileController {
  constructor(
    $rootScope,
    $scope,
    $state,
    $mdDialog,
    paymentProfileService,
    storageService,
    uiService,
    PaypalPaymentProfile,
    organization
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.paymentProfileService = paymentProfileService;
    this.uiService = uiService;
    this.PaypalPaymentProfile = PaypalPaymentProfile;
    this.organization = organization;

    this.storage = storageService.read();

    this.run();
  }

  run() {
    this.$scope.organization = this.organization;
    this.$scope.profile = new this.PaypalPaymentProfile();
    this.$scope.profile.organizationId = this.organization.id;
    this.$scope.close = this.$mdDialog.hide;

    this.$scope.submit = (profile) => {
      this.paymentProfileService.create(this.storage.token, profile).then((profile) => {
        this.$rootScope.$broadcast('PAYMENT.PROFILE.CREATED', profile);
        this.$scope.close();
        this.uiService.notify('Payment Profile created');
      }, () => {
        this.uiService.notify('Unable to create');
      });
    };
  }
}

CreatePaymentProfileController.$inject = [
  '$rootScope',
  '$scope',
  '$state',
  '$mdDialog',
  'PaymentProfileService',
  'StorageService',
  'UIService',
  'PaypalPaymentProfile',
  'organization'
];
