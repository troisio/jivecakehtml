export default class PublicEventItemController {
  constructor($window, $mdDialog, $timeout, $scope, itemService, itemTransactionService, accessService, uiService, storageService) {
    this.$window = $window;
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.itemService = itemService;
    this.itemTransactionService = itemTransactionService;
    this.accessService = accessService;
    this.uiService = uiService;
    this.storageService = storageService;

    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.selected = [];
    this.$scope.itemFormData = {};
    this.defaultAmountSize = uiService.getDefaultItemCartSelectionSize();
    this.$scope.uiReady = false;
    this.scheduledModificationTimes = new this.$window.Set();
    this.$scope.time = new this.$window.Date();

    const storage = this.storageService.read();
    this.$scope.user = storage.profile;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.ready.then(() => {
      this.$scope.event = this.$scope.$parent.event;

      const storage = this.storageService.read();
      const currentTime = new this.$window.Date().getTime();

      return this.itemService.getAggregatedItemData(storage.token, {
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
          const completOrPendingFilter = (transaction) => transaction.status === this.itemTransactionService.getPaymentCompleteStatus() || transaction.status === this.itemTransactionService.getPaymentPendingStatus();
          const completeOrPendingTransactions = itemData.transactions.filter(completOrPendingFilter);

          let remaingUserTransactions = null, remainingTotalAvailibleTransactions = null;

          if (storage.profile === null) {
            itemData.completOrPendingUserTransactions = null;
          } else {
            itemData.completOrPendingUserTransactions = itemData.transactions.filter(transaction => transaction.user_id === storage.profile.user_id)
                                                                             .filter(completOrPendingFilter);

            if (itemData.item.maximumPerUser !== null) {
              remaingUserTransactions = itemData.item.maximumPerUser - itemData.completOrPendingUserTransactions.length;
            }
          }

          if (itemData.item.totalAvailible !== null) {
            remainingTotalAvailibleTransactions = itemData.item.totalAvailible - completeOrPendingTransactions.length;
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
          itemData.amountSelections = amountSelectionSize > -1 ? this.$window.Array.from(new this.$window.Array(amountSelectionSize), (item, index) => index + 1): [];
          itemData.completeOrPendingTransactions = completeOrPendingTransactions;
        });

        this.$scope.groupData = groupData;

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

  purchase(item, quantity) {
    const storage = this.storageService.read();

    this.itemTransactionService.purchase(storage.token, item.id, {quantity: quantity}).then(() => {
      if (!('EventSource' in this.$window)) {
        this.uiService.notify('Item succesfully purchased');
      }

      this.run();
    }, () => {
      this.uiService.notify('Unable to purchase item');
    });
  }

  login() {
    this.accessService.oauthSignIn();
  }
}

PublicEventItemController.$inject = [
  '$window',
  '$mdDialog',
  '$timeout',
  '$scope',
  'ItemService',
  'ItemTransactionService',
  'AccessService',
  'UIService',
  'StorageService'
];