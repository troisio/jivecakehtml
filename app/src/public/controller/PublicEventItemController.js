export default class PublicEventItemController {
  constructor(
    angular,
    $q,
    $location,
    $state,
    $window,
    $mdDialog,
    $timeout,
    $scope,
    itemService,
    transactionService,
    paymentProfileService,
    accessService,
    uiService,
    storageService,
    paypalService,
    settings
  ) {
    this.angular = angular;
    this.$q = $q;
    this.$location = $location;
    this.$state = $state;
    this.$window = $window;
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.paymentProfileService = paymentProfileService;
    this.accessService = accessService;
    this.uiService = uiService;
    this.storageService = storageService;
    this.paypalService = paypalService;
    this.settings = settings;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.selected = [];
    this.$scope.itemFormData = {};
    this.defaultAmountSize = uiService.getDefaultItemCartSelectionSize();
    this.$scope.uiReady = false;
    this.scheduledModificationTimes = new this.$window.Set();
    this.$scope.time = new this.$window.Date();
    this.$scope.hasAnySelections = false;

    const storage = this.storageService.read();
    this.$scope.auth = storage.auth;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.ready.then(() => {
      this.$scope.event = this.$scope.$parent.event;

      if (this.$scope.event !== null) {
        const storage = this.storageService.read();
        const currentTime = new this.$window.Date().getTime();

        if (this.$scope.event.paymentProfileId !== null) {
          this.paymentProfileService.publicSearch({
            id: this.$scope.event.paymentProfileId
          }).then((search) => {
            if (search.entity.length > 0) {
              this.$scope.paymentProfile = search.entity[0];
            }
          });
        }

        const idToken = storage.auth === null ? null : storage.auth.idToken;

        return this.itemService.getAggregatedItemData(idToken, {
          eventId: this.$scope.event.id
        }).then((aggregatedData) => {
          let groupData;

          if (aggregatedData.length > 0) {
            groupData = aggregatedData[0];
          } else {
            groupData = {
              itemData: []
            };
          }

          groupData.itemData.forEach((itemData) => {
            const completOrPendingFilter = (transaction) => transaction.status === this.transactionService.getPaymentCompleteStatus() || transaction.status === this.transactionService.getPaymentPendingStatus();
            const completeOrPendingTransactions = itemData.transactions.filter(completOrPendingFilter);

            let remaingUserTransactions = null, remainingTotalAvailibleTransactions = null;

            if (storage.profile === null) {
              itemData.completOrPendingUserTransactions = null;
            } else {
              itemData.completOrPendingUserTransactions = itemData.transactions.filter(transaction => transaction.user_id === storage.auth.idTokenPayload.sub)
                .filter(completOrPendingFilter);

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
              amountSelectionSize = this.$window.Math.min(remaingUserTransactions, remainingTotalAvailibleTransactions);
            }

            itemData.remainingTotalAvailibleTransactions = remainingTotalAvailibleTransactions;
            itemData.remaingUserTransactions = remaingUserTransactions;

            itemData.amountSelections = amountSelectionSize > -1 ? this.$window.Array.from(new this.$window.Array(amountSelectionSize + 1), (item, index) => index): [0];
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
        });
      }
    }, () => {
      this.uiService.notify('Unable to retrieve data');
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  viewItem(item) {
    this.$mdDialog.show({
      controller: ['$window', '$scope', '$sanitize', 'item',  function($window, $scope, $sanitize, item) {
        $scope.time = new $window.Date();
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

  addToCart(itemData, amount) {
    const storage = this.storageService.read();

    let derivedAmount = amount;

    if (storage.cart.has(itemData.item.id)) {
      derivedAmount += storage.cart.get(itemData.item.id).count;
    }

    if (itemData.remainingTotalAvailibleTransactions !== null && itemData.remaingUserTransactions !== null) {
      if (derivedAmount > itemData.remainingTotalAvailibleTransactions && derivedAmount > itemData.remaingUserTransactions) {
        derivedAmount = this.$window.Math.max(itemData.remainingTotalAvailibleTransactions, itemData.remaingUserTransactions);
      } else if (derivedAmount > itemData.remainingTotalAvailibleTransactions) {
        derivedAmount = itemData.remainingTotalAvailibleTransaction;
      } else if (derivedAmount > itemData.remaingUserTransactions) {
        derivedAmount = itemData.remaingUserTransactions;
      }
    } else if (itemData.remainingTotalAvailibleTransactions !== null) {
      if (derivedAmount > itemData.remainingTotalAvailibleTransactions) {
        derivedAmount = itemData.remainingTotalAvailibleTransaction;
      }
    } else if (itemData.remaingUserTransactions !== null) {
      if (derivedAmount > itemData.remaingUserTransactions) {
        derivedAmount = itemData.remaingUserTransactions;
      }
    } else {
      if (derivedAmount > this.defaultAmountSize) {
        derivedAmount = this.defaultAmountSize;
      }
    }

    const cart = storage.cart.put(itemData.item, derivedAmount);
    this.storageService.write(storage);

    this.uiService.notify(itemData.item.name + ' added to cart');
  }

  checkout(group, itemFormData) {
    const totalSelected = this.$window.Object.keys(itemFormData)
      .reduce((previous, key) => previous + itemFormData[key].amount, 0);

    if (totalSelected > 0) {
      const mockIpn = this.settings.paypal.mock;
      const timestamp = new this.$window.Date().getTime();
      const storage = this.storageService.read();
      const items = group.itemData.map(itemData => itemData.item);
      const close = this.uiService.load().close;

      this.paypalService.createPaymentDetails(storage.auth.idToken).then((detail) => {
        if (mockIpn) {
          const itemQuantities = group.itemData.map(itemData => new this.$window.Object({
            quantity: itemFormData[itemData.item.id].amount,
            item: itemData.item
          })).filter(itemQuantity => itemQuantity.quantity > 0);

          this.paypalService.getCartIpn(
            itemQuantities,
            timestamp,
            group.parent.currency,
            timestamp,
            'Completed',
            '',
            detail.custom
          ).then((ipn) => {
            this.paypalService.submitIpn(storage.auth.idToken, ipn, this.paypalService.getVerified()).then(() => {
              this.$state.go('application.public.checkoutConfirmation');
            }, () => {
              this.uiService.notify('Unable to create test transaction');
            });
          }).finally(() => {
            this.run();
          });
        } else {
          const returnUrl = this.$location.$$protocol + '://' + this.$location.$$host + (this.$location.port() === 80 || this.$location.port() === 443 ? '' : ':' + this.$location.port()) + '/confirmation';
          const notifyUrl = [this.settings.jivecakeapi.uri, 'paypal', 'ipn'].join('/');
          const business = this.$scope.paymentProfile.email;
          const form = this.angular.element(`
            <form action="https://www.paypal.com/cgi-bin/webscr" method="POST">
            <input type="hidden" name="cmd" value="_cart">
            <input type="hidden" name="upload" value="1">
            <input type="hidden" name="business" value="${business}">
            <input type="hidden" name="currency_code" value="${group.parent.currency}">
            <input type="hidden" name="notify_url" value="${notifyUrl}">
            <input type="hidden" name="custom" value="${detail.custom}">
            <input type="hidden" name="return" value="${returnUrl}">
            </form>`
          )[0];

          let index = 1;

          const storage = this.storageService.read();
          const selectionAndItemData = Object.keys(itemFormData).map((itemId) => {
            const selection = itemFormData[itemId];
            const itemData = group.itemData.find((datum) => datum.item.id === itemId);

            return {
              selection: selection,
              itemData: itemData
            };
          }).filter(data => data.selection.amount > 0);

          selectionAndItemData.filter(data => data.itemData.amount === null)
            .forEach((data) => {
              this.transactionService.purchase(
                storage.auth.idToken,
                data.itemData.item.id,
                {quantity: data.selection.amount}
              );
            });

          const paidSelections = selectionAndItemData.filter(data => data.itemData.amount !== null);

          if (paidSelections.length > 0) {
            paidSelections.forEach((data, index) => {
              const elements = this.angular.element(`
                <input type="hidden" name="item_name_${index + 1}" value="${data.itemData.item.name}">
                <input type="hidden" name="amount_${index + 1}" value="${data.itemData.amount}">
                <input type="hidden" name="item_number_${index + 1}" value="${data.itemData.item.id}">
                <input type="hidden" name="quantity_${index + 1}" value="${data.selection.amount}">`
              );

              for (let index = 0; index < elements.length; index++) {
                form.appendChild(elements[index]);
              }
            });

            this.$window.document.body.appendChild(form);
            form.submit();
          }

          return close.promise;
        }
      }).then(() => {
        this.uiService.notify('Your items have been succesfully added');
      }, () => {
        this.uiService.notify('Sorry, there was an error during your checkout');
      }).finally(function() {
        close.resolve();
      });
    } else {
      this.uiService.notify('No item selection made');
    }
  }

  login() {
    this.accessService.oauthSignIn();
  }
}

PublicEventItemController.$inject = [
  'angular',
  '$q',
  '$location',
  '$state',
  '$window',
  '$mdDialog',
  '$timeout',
  '$scope',
  'ItemService',
  'TransactionService',
  'PaymentProfileService',
  'AccessService',
  'UIService',
  'StorageService',
  'PaypalService',
  'settings'
];