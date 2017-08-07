export default class PublicEventController {
  constructor(
    $q,
    $state,
    $mdDialog,
    $timeout,
    $scope,
    eventService,
    transactionService,
    accessService,
    uiService,
    storageService,
    paypalService,
    stripeService,
    StripePaymentProfile,
    PaypalPaymentProfile,
    settings
  ) {
    this.$q = $q;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.accessService = accessService;
    this.uiService = uiService;
    this.storageService = storageService;
    this.paypalService = paypalService;
    this.stripeService = stripeService;
    this.StripePaymentProfile = StripePaymentProfile;
    this.PaypalPaymentProfile = PaypalPaymentProfile;
    this.settings = settings;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.selected = [];
    this.defaultAmountSize = uiService.getDefaultItemCartSelectionSize();
    this.$scope.time = new Date();

    this.setDefaultState();

    const storage = this.storageService.read();
    this.$scope.auth = storage.auth;

    this.eventSearchFuture = this.eventService.publicSearch({
      hash: this.$state.params.hash
    });

    this.$scope.$parent.ready.then(() => {}, () => {}).then(() => {
      this.run();
    });
  }

  run() {
    this.setDefaultState();

    const storage = this.storageService.read();
    const currentTime = new Date().getTime();
    const idToken = storage.auth === null ? null : storage.auth.idToken;

    return this.eventSearchFuture.then((eventSearch) => {
      const events = eventSearch.entity;
      let future;

      if (events.length === 0) {
        this.$scope.groupData = {event: null};
        future = Promise.resolve();
      } else {
        future = this.eventService.getAggregatedEventData(events[0].id, idToken).then((groupData) => {
          this.$scope.groupData = groupData;
          this.$scope.organization = groupData.organization;
          this.$scope.profile = groupData.profile;

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

            amountSelectionSize = Math.min(
              amountSelectionSize,
              this.uiService.getMaximumItemCartSelectionSize()
            );

            itemData.remainingTotalAvailibleTransactions = remainingTotalAvailibleTransactions;
            itemData.remaingUserTransactions = remaingUserTransactions;

            itemData.amountSelections = amountSelectionSize > -1 ? Array.from(new Array(amountSelectionSize + 1), (item, index) => index): [0];
            itemData.completeOrPendingTransactions = completeOrPendingTransactions;
          });

          for (let itemData of groupData.itemData) {
            const canDisplayItem = (
              itemData.item.totalAvailible === null ||
              itemData.remainingTotalAvailibleTransactions > 0
            ) && (
              itemData.item.maximumPerUser === null ||
              itemData.remaingUserTransactions > 0
            );

            if (canDisplayItem) {
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
        });
      }

      return future;
    })
    .then(() => {}, () => {})
    .then(() => {
      this.$scope.uiReady = true;
    });
  }

  itemIsBlocked(group, itemData, auth) {
    const soldOut = itemData.remainingTotalAvailibleTransactions !== null && itemData.remainingTotalAvailibleTransactions < 1;
    const soldOutForUser = itemData.remaingUserTransactions !== null && itemData.remaingUserTransactions < 1;
    const requiresAccount = itemData.item.requiresAccountForRegistration();
    const hasCurrencyAndPaymentProfile = group.event.hasCurrencyAndPaymentProfile();

    return soldOut || soldOutForUser || (requiresAccount && auth === null) || !hasCurrencyAndPaymentProfile || group.profile === null;
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

  processStripe(group, paidSelections) {
    const defer = this.$q.defer();
    const pk = this.settings.stripe.useAsMock ? this.settings.stripe.pk : group.profile.stripe_publishable_key;
    const total = this.getTotalFromSelections(paidSelections);

    const checkout = StripeCheckout.configure({
      name: group.event.name,
      key: pk,
      image: 'https://jivecake.com/assets/safari/apple-touch-120x120.png',
      locale: 'auto',
      zipCode: true,
      currency: group.event.currency,
      token: (token) => {
        const storage = this.storageService.read();
        const itemData = paidSelections.map((selection) => ({
          quantity: selection.selection.amount,
          entity: selection.itemData.item.id
        }));

        const idToken = storage.auth === null ? null : storage.auth.idToken;

        const orderFuture = this.stripeService.order(idToken, group.event.id, {
          token: token,
          itemData: itemData
        }).then(() => {
          this.$state.go('application.internal.myTransaction', {
            user_id: storage.auth.idTokenPayload.sub
          });
        }, (response) => {
          if (response.status == 400 && Array.isArray(response.data)) {
            this.$mdDialog.show({
              controller: 'OrderErrorController',
              templateUrl: '/src/public/partial/orderError.html',
              clickOutsideToClose: true,
              locals: {
                errors: response.data
              }
            });
          } else {
            this.uiService.notify('Sorry, unable to process your order');
          }
        });

        orderFuture.finally(() => {
          defer.resolve();
        });
      },
      closed: function () {
        defer.reject();
      }
    });

    checkout.open({
      name: 'JiveCake',
      description: 'Checkout',
      amount: total * 100
    });

    return defer.promise;
  }

  getTotalFromSelections(selections) {
    return selections.reduce((sum, selection) => selection.selection.amount * selection.itemData.amount + sum, 0);
  }

  processPaypal(group, paidSelections) {
    const storage = this.storageService.read();
    const token = storage.auth === null ? null : storage.auth.idToken;

    const buttonSelector = '#paypal-button';
    const node = document.querySelector(buttonSelector);
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    paypal.Button.render({
      env: this.settings.paypal.env,
      commit: true,
      payment: () => {
        return new Promise((resolve, reject) => {
          const itemData = paidSelections.map(selection => ({
            quantity: selection.selection.amount,
            entity: selection.itemData.item.id
          }));

          this.paypalService.generatePayment(token, group.event.id, {
            itemData: itemData
          }).then(data => {
            resolve(data.id);
          }, (response) => {
            reject(response);
          });
        });
      },
      onAuthorize: (authorization) => {
        this.uiReady = false;

        this.paypalService.execute(token, authorization).then(() => {
          this.uiService.notify('Payment complete');

          if (token === null) {
            this.$state.go('application.internal.myTransaction', {
              user_id: storage.auth.idTokenPayload.sub
            });
          } else {
            this.run();
          }
        }, () => {
          this.uiService.notify('Unable to complete payment');
        }).then(() => {
          this.uiReady = true;
        });
      }
    }, buttonSelector);
  }

  checkout(group, itemFormData) {
    const violatesConsent = group.assets.length > 0 && !this.$scope.hasConsented;

    if (violatesConsent) {
      this.uiService.notify('Must consent to terms before checkout');
    } else {
      const storage = this.storageService.read();
      const idToken = storage.auth === null ? null : storage.auth.idToken;
      const totalSelected = Object.keys(itemFormData)
        .reduce((previous, key) => previous + itemFormData[key].amount, 0);

      if (totalSelected > 0) {
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
              idToken,
              data.itemData.item.id,
              {quantity: data.selection.amount}
            );
          });

        this.$q.all(unpaidFutures).then(() => {
          const paidSelections = selectionAndItemData.filter(data => data.itemData.amount > 0);

          if (paidSelections.length > 0) {
            if (this.$scope.profile instanceof this.StripePaymentProfile) {
              this.processStripe(group, paidSelections);
            } else if (this.$scope.profile instanceof this.PaypalPaymentProfile) {
              this.$scope.isPaypalCheckoutView = true;
              this.processPaypal(group, paidSelections, this.$scope.paymentProfile);
            } else {
              throw new Error('invalid payment profile implementation');
            }
          } else {
            this.$state.go('application.internal.myTransaction');
          }
        }, () => {
          this.uiService.notify('Unable to purchase free items');
        });
      } else {
        this.uiService.notify('No selection made');
      }
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

  showAsset($event, asset) {
    this.$mdDialog.show({
      targetEvent: $event,
      controller: ['$scope', function($scope) {
        $scope.text = atob(asset.data);
      }],
      templateUrl: '/src/organization/partial/consent.html',
      clickOutsideToClose: true
    });
  }

  setDefaultState() {
    this.$scope.uiReady = false;
    this.$scope.hasAnySelections = false;
    this.$scope.itemFormData = {};
    this.scheduledModificationTimes = new Set();
    this.$scope.isPaypalCheckoutView = false;
    this.$scope.hasConsented = false;
  }
}

PublicEventController.$inject = [
  '$q',
  '$state',
  '$mdDialog',
  '$timeout',
  '$scope',
  'EventService',
  'TransactionService',
  'AccessService',
  'UIService',
  'StorageService',
  'PaypalService',
  'StripeService',
  'StripePaymentProfile',
  'PaypalPaymentProfile',
  'settings'
];