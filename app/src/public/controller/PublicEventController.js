export default class PublicEventController {
  constructor(
    $q,
    $location,
    $state,
    $mdDialog,
    $timeout,
    $scope,
    itemService,
    eventService,
    transactionService,
    paymentProfileService,
    organizationService,
    accessService,
    uiService,
    storageService,
    paypalService,
    settings
  ) {
    this.$q = $q;
    this.$location = $location;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.itemService = itemService;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.paymentProfileService = paymentProfileService;
    this.organizationService = organizationService;
    this.accessService = accessService;
    this.uiService = uiService;
    this.storageService = storageService;
    this.paypalService = paypalService;
    this.settings = settings;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.selected = [];
    this.defaultAmountSize = uiService.getDefaultItemCartSelectionSize();
    this.$scope.uiReady = false;
    this.scheduledModificationTimes = new Set();
    this.$scope.time = new Date();
    this.$scope.hasAnySelections = false;

    const storage = this.storageService.read();
    this.$scope.auth = storage.auth;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;
    this.$scope.itemFormData = {};

    const storage = this.storageService.read();
    const currentTime = new Date().getTime();
    const idToken = storage.auth === null ? null : storage.auth.idToken;

    return this.eventService.getAggregatedEventData(this.$state.params.id, idToken).then((groupData) => {
      const organizationPromise = this.organizationService.publicSearch({
        id: groupData.event.organizationId
      }).then(searchResult => {
        this.$scope.organization = searchResult.entity[0];
      });

      const paymentProfilePromise = this.paymentProfileService.publicSearch({
        id: groupData.event.paymentProfileId
      }).then((search) => {
        if (search.entity.length > 0) {
          this.$scope.paymentProfile = search.entity[0];
        }
      });

      groupData.itemData.forEach((itemData) => {
        this.$scope.itemFormData[itemData.item.id] = {amount: 0};

        const completeOrPendingTransactions = itemData.transactions.filter(this.transactionService.countingFilter);

        let remaingUserTransactions = null, remainingTotalAvailibleTransactions = null;

        if (storage.auth === null) {
          itemData.completOrPendingUserTransactions = null;
        } else {
          itemData.completOrPendingUserTransactions = itemData.transactions.filter(transaction => transaction.user_id === storage.auth.idTokenPayload.sub)
            .filter(this.transactionService.countingFilter);

          if (itemData.item.maximumPerUser !== null) {
            const total  = itemData.completOrPendingUserTransactions.reduce((previous, next) => previous + next.quantity, 0);
            remaingUserTransactions = itemData.item.maximumPerUser - total;
          }
        }

        if (itemData.item.totalAvailible !== null) {
          const total  = completeOrPendingTransactions.reduce((previous, next) => previous + next.quantity, 0);
          remainingTotalAvailibleTransactions = itemData.item.totalAvailible - total;
        }

        let amountSelectionSize;

        if (remainingTotalAvailibleTransactions === null && remaingUserTransactions === null) {
          amountSelectionSize = this.defaultAmountSize;
        } else if (remaingUserTransactions === null) {
          amountSelectionSize = remainingTotalAvailibleTransactions;
        } else if (remainingTotalAvailibleTransactions === null) {
          amountSelectionSize = remaingUserTransactions;
        } else {
          amountSelectionSize = Math.min(remaingUserTransactions, remainingTotalAvailibleTransactions);
        }

        itemData.remainingTotalAvailibleTransactions = remainingTotalAvailibleTransactions;
        itemData.remaingUserTransactions = remaingUserTransactions;

        itemData.amountSelections = amountSelectionSize > -1 ? Array.from(new Array(amountSelectionSize + 1), (item, index) => index): [0];
        itemData.completeOrPendingTransactions = completeOrPendingTransactions;
      });

      this.$scope.groupData = groupData;

      for (let index = 0; index < this.$scope.groupData.itemData.length; index++) {
        const itemData = this.$scope.groupData.itemData[index];

        if ((itemData.item.totalAvailible === null || itemData.remainingTotalAvailibleTransactions > 0) && (itemData.item.maximumPerUser === null || itemData.remainingTotalAvailibleTransactions > 0)) {
          this.$scope.hasAnySelections = true;
          break;
        }
      }

      const positiveTimes = groupData.itemData
        .filter(itemData => itemData.item.timeAmounts !== null)
        .reduce((array, itemData) => {
          array.push.apply(array, itemData.item.timeAmounts.map(timeAmount => timeAmount.after));
          return array;
        }, [])
        .map(time => time - currentTime)
        .filter(time => time > 0 && !this.scheduledModificationTimes.has(time));

      positiveTimes.forEach(this.scheduledModificationTimes.add, this.scheduledModificationTimes);
      positiveTimes.forEach(time => {
        this.$timeout(() => {
          this.uiService.notify('Updating data');
          this.run();
        }, time);
      });

      return this.$q.all([organizationPromise, paymentProfilePromise]);
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  itemIsBlocked(group, itemData, auth) {
    const soldOut = itemData.remainingTotalAvailibleTransactions !== null && itemData.remainingTotalAvailibleTransactions < 1;
    const soldOutForUser = itemData.remaingUserTransactions !== null && itemData.remaingUserTransactions < 1;
    const requiresAccount = itemData.item.requiresAccountForRegistration();
    const hasCurrencyAndPaymentProfile = group.event.hasCurrencyAndPaymentProfile();

    return soldOut || soldOutForUser || (requiresAccount && auth === null) || !hasCurrencyAndPaymentProfile;
  }

  showInformation(event, organization) {
    this.$mdDialog.show({
      controller: ['$sanitize', '$scope', 'event', 'organization', function($sanitize, $scope, event, organization) {
        $scope.event = event;
        $scope.organization = organization;
        $scope.time = new Date();
        $scope.$sanitize = $sanitize;
      }],
      templateUrl: '/src/public/partial/viewEvent.html',
      clickOutsideToClose: true,
      locals: {
        event: event,
        organization: organization
      }
    });
  }

  checkout(group, itemFormData) {
    const totalSelected = Object.keys(itemFormData)
      .reduce((previous, key) => previous + itemFormData[key].amount, 0);

    if (totalSelected > 0) {
      const mockIpn = this.settings.paypal.mock;
      const storage = this.storageService.read();
      const items = group.itemData.map(itemData => itemData.item);
      const close = this.uiService.load().close;
      const selectionAndItemData = Object.keys(itemFormData).map((itemId) => {
        const selection = itemFormData[itemId];
        const itemData = group.itemData.find((datum) => datum.item.id === itemId);

        return {
          selection: selection,
          itemData: itemData
        };
      }).filter(data => data.selection.amount > 0);

      const unpaidFutures = selectionAndItemData.filter(data => data.itemData.amount === 0)
        .map((data) => {
          return this.transactionService.purchase(
            storage.auth.idToken,
            data.itemData.item.id,
            {quantity: data.selection.amount}
          );
        });

      this.$q.all(unpaidFutures).then(() => {
        const promise = storage.auth === null ? this.paypalService.createPaymentDetails() : this.paypalService.createPaymentDetails(storage.auth.idToken);

        return promise.then((detail) => {
          let future;

          if (mockIpn) {
            const timestamp = new Date().getTime();

            const itemQuantities = group.itemData.filter(data => data.amount > 0).map(data => new Object({
                quantity: itemFormData[data.item.id].amount,
                item: data.item
              })).filter(itemQuantity => itemQuantity.quantity > 0);

            if (itemQuantities.length > 0) {
              future = this.paypalService.getCartIpn(
                itemQuantities,
                timestamp,
                group.event.currency,
                timestamp,
                'Completed',
                '',
                detail.custom
              ).then((ipn) => {
                let future;

                if (storage.auth === null) {
                  future = this.$q.resolve('Unable to mock Paypal IPN while not logged in');
                } else {
                  future = this.paypalService.submitIpn(storage.auth.idToken, ipn, this.paypalService.getVerified()).then(() => {
                    this.$state.go('application.public.checkoutConfirmation');
                    return 'Test Paypal IPNs submitted';
                  }, function() {
                    return 'Unable to create test transaction';
                  });
                }

                return future;
              });
            } else {
              future = this.$q.resolve('Item succesfully processed');
            }
          } else {
            const returnUrl = this.$location.$$protocol + '://' + this.$location.$$host + (this.$location.port() === 80 || this.$location.port() === 443 ? '' : ':' + this.$location.port()) + '/confirmation';
            const notifyUrl = [this.settings.jivecakeapi.uri, 'paypal', 'ipn'].join('/');
            const business = this.$scope.paymentProfile.email;
            const form = angular.element(`
              <form action="https://www.paypal.com/cgi-bin/webscr" method="POST">
              <input type="hidden" name="cmd" value="_cart">
              <input type="hidden" name="upload" value="1">
              <input type="hidden" name="business" value="${business}">
              <input type="hidden" name="currency_code" value="${group.event.currency}">
              <input type="hidden" name="notify_url" value="${notifyUrl}">
              <input type="hidden" name="custom" value="${detail.custom}">
              <input type="hidden" name="return" value="${returnUrl}">
              </form>`
            )[0];

            let index = 1;

            const paidSelections = selectionAndItemData.filter(data => data.itemData.amount > 0);

            if (paidSelections.length > 0) {
              paidSelections.forEach((data, index) => {
                const elements = angular.element(`
                  <input type="hidden" name="item_name_${index + 1}" value="${data.itemData.item.name}">
                  <input type="hidden" name="amount_${index + 1}" value="${data.itemData.amount}">
                  <input type="hidden" name="item_number_${index + 1}" value="${data.itemData.item.id}">
                  <input type="hidden" name="quantity_${index + 1}" value="${data.selection.amount}">`
                );

                for (let index = 0; index < elements.length; index++) {
                  form.appendChild(elements[index]);
                }
              });

              document.body.appendChild(form);
              form.submit();
            }

            future = this.$q.resolve('');
          }

          return future;
        }, () => {
          return 'Unable to create payment details';
        });
      }, (resolve) => {
        return 'Unable to purchase free items';
      }).then((message) => {
        if (message.length > 0) {
          this.uiService.notify(message);
        }
      }, (message) => {
        if (message.length > 0) {
          this.uiService.notify(message);
        }
      }).finally(() => {
        if (this.settings.paypal.mock) {
          this.run();
          close.resolve();
        }
      });
    } else {
      this.uiService.notify('No item selection made');
    }
  }

  login() {
    this.accessService.oauthSignIn();
  }

  viewItem(item) {
    this.$mdDialog.show({
      controller: ['$scope', '$sanitize', 'item',  function($scope, $sanitize, item) {
        $scope.time = new Date();
        $scope.item = item;
        $scope.$sanitize = $sanitize;
      }],
      templateUrl: '/src/public/partial/viewItem.html',
      clickOutsideToClose: true,
      locals: {
        item: item
      }
    });
  }
}

PublicEventController.$inject = [
  '$q',
  '$location',
  '$state',
  '$mdDialog',
  '$timeout',
  '$scope',
  'ItemService',
  'EventService',
  'TransactionService',
  'PaymentProfileService',
  'OrganizationService',
  'AccessService',
  'UIService',
  'StorageService',
  'PaypalService',
  'settings'
];