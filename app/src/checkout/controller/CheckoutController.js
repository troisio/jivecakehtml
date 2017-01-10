export default class CheckoutController {
  constructor($location, $window, $q, $state, $scope, $timeout, $stateParams, itemService, transactionService, settings, paypalService, uiService, paymentProfileService, eventService, organizationService, storageService, Item) {
    this.$window = $window;
    this.$q = $q;
    this.$state = $state;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$stateParams = $stateParams;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.settings = settings;
    this.paypalService = paypalService;
    this.uiService = uiService;
    this.paymentProfileService = paymentProfileService;
    this.eventService = eventService;
    this.organizationService = organizationService;
    this.storageService = storageService;
    this.Item = Item;

    this.$scope.selected = [];
    this.$scope.custom = '{}';
    this.$scope.notify_url = [settings.jivecakeapi.uri, 'paypal', 'ipn'].join('/');
    this.$scope.returnUrl = $location.$$protocol + '://' + $location.$$host + ($location.port() === 80 || $location.port() === 443 ? '' : ':' + $location.port()) + '/confirmation';
    this.$scope.currentTimestamp = new this.$window.Date().getTime();

    this.$scope.submit = (itemCount) => {
      this.submit(itemCount);
    };

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then((resolve) => {
      const storage = this.storageService.read();
      const itemIds = this.$window.Object.keys(storage.cart.data);
      const currentTime = new this.$window.Date().getTime();

      return this.itemService.getAggregatedItemData(storage.token, {
        id: itemIds
      }).then((groups) => {
        const filteredGroups = groups.filter(group => group.parent.id === this.$state.params.entityId);
        const group = filteredGroups[0];

        group.itemData.forEach(function(itemData) {
          itemData.count = storage.cart.get(itemData.item.id).count;
        });

        this.$scope.total = group.itemData.reduce((total, current) => total + current.amount * current.count, 0);
        this.$scope.group = group;

        return this.paymentProfileService.publicSearch({
          id: group.parent.paymentProfileId
        }).then((search) => {
          if (search.entity.length > 0) {
            this.$scope.paymentProfile = search.entity[0];
          }
        });
      });
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  submit($event) {
    $event.preventDefault();

    const mockIpn = this.settings.paypal.mock;
    const timestamp = new Date().getTime();
    const storage = this.storageService.read();
    const items = this.$scope.group.itemData.map(itemData => itemData.item);

    this.paypalService.createPaymentDetails(storage.token).then((detail) => {
      const custom = typeof detail === 'undefined' ? '' : detail.custom;
      this.$scope.custom = custom;

      if (mockIpn) {
        const itemQuantities = this.$scope.group.itemData.map(itemData => new this.$window.Object({
          quantity: itemData.count,
          item: itemData.item
        }));

        this.paypalService.getCartIpn(
          itemQuantities,
          timestamp,
          this.$scope.group.parent.currency,
          timestamp,
          'Completed',
          '',
          custom
        ).then((ipn) => {
          this.paypalService.submitIpn(storage.token, ipn, this.paypalService.getVerified()).then(() => {
            this.$state.go('application.public.checkoutConfirmation');
          }, () => {
            this.uiService.notify('Unable to create test transaction');
          });
        });
      } else {
        this.uiService.load();

        const form = $event.target;

        this.$timeout(function() {
          form.submit();
        });
      }
    });
  }
}

CheckoutController.$inject = [
  '$location',
  '$window',
  '$q',
  '$state',
  '$scope',
  '$timeout',
  '$stateParams',
  'ItemService',
  'TransactionService',
  'settings',
  'PaypalService',
  'UIService',
  'PaymentProfileService',
  'EventService',
  'OrganizationService',
  'StorageService',
  'Item'
];