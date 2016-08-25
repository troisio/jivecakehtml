export default class CartController {
  constructor($window, $scope, $q, $state, Event, Organization, itemService, itemTransactionService, storageService, uiService) {
    this.$window = $window;
    this.$scope = $scope;
    this.$q = $q;
    this.$state = $state;
    this.Event = Event;
    this.Organization = Organization;
    this.itemService = itemService;
    this.itemTransactionService = itemTransactionService;
    this.storageService = storageService;
    this.uiService = uiService;

    this.$scope.uiReady = false;
    this.$scope.selected = [];

    this.run();
  }

  run() {
    this.$scope.$parent.ready.then((resolve) => {
      this.getGroupData().then((groups) => {
        const storage = this.storageService.read();
        const deletedItems = this.removeInvalidItemsFromCart(storage.cart, groups);
        const modifiedItemData = this.conformCountsToToGroupData(storage.cart, groups);

        this.storageService.write(storage);

        if (deletedItems.size > 0 || modifiedItemData.length > 0) {
          this.uiService.notify('Your cart has been updated');
        }

        groups.forEach(group => {
          group.itemData = group.itemData.filter(itemData => !deletedItems.has(itemData.item.id));
        });

        this.$scope.groups = groups.filter(group => group.itemData.length > 0);
      });
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  getGroupData() {
    const storage = this.storageService.read();
    const itemIds = this.$window.Object.keys(storage.cart.data);
    const currentTime = new this.$window.Date().getTime();

    const future = itemIds.length === 0 ? this.$q.resolve([])  : this.itemService.getAggregatedItemData(storage.token, {id: itemIds});

    return future.then((groups) => {
      groups.forEach((groupData) => {
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

          let maximumSelectionSize;

          const cartCount = storage.cart.data[itemData.item.id].count;

          if (remainingTotalAvailibleTransactions === null && remaingUserTransactions === null) {
            maximumSelectionSize = this.$window.Math.max(cartCount, this.uiService.getDefaultItemCartSelectionSize());
          } else if (remaingUserTransactions === null) {
            maximumSelectionSize = remainingTotalAvailibleTransactions;
          } else if (remainingTotalAvailibleTransactions === null) {
            maximumSelectionSize = remaingUserTransactions;
          } else {
            maximumSelectionSize = this.$window.Math.min(remaingUserTransactions, remainingTotalAvailibleTransactions);
          }

          itemData.count = cartCount;
          itemData.amountSelections = this.$window.Array.from(new this.$window.Array(maximumSelectionSize), (item, index) => index + 1);
          itemData.completeOrPendingTransactions = completeOrPendingTransactions;
        });
      });

      return groups;
    });
  }

  conformCountsToToGroupData(cart, groups) {
    const modifiedItemData = [];

    groups.forEach(group => {
      group.itemData.forEach(itemData => {
        const itemCount = cart.get(itemData.item.id);

        if (itemData.amountSelections.length < itemCount.count) {
          itemCount.count = itemData.amountSelections.length;
          itemData.count = itemData.amountSelections.length;

          modifiedItemData.push(itemData);
        }
      });
    });

    return modifiedItemData;
  }

  removeInvalidItemsFromCart(cart, groups) {
    const deleted = new this.$window.Set();
    const idToItemData = {};

    groups.forEach(group => {
      group.itemData.forEach(itemData => {
        idToItemData[itemData.item.id] = itemData;
      });
    });

    for (let key in cart.data) {
      const itemData = idToItemData[key];

      if (itemData.amount === null || !(key in idToItemData)) {
        cart.delete(key);
        deleted.add(key);
      }
    }

    return deleted;
  }

  selectAmount(item, amount) {
    const storage = this.storageService.read();
    const cart = storage.cart.put(item, amount);
    this.storageService.write(storage);
  }

  remove(group, itemData) {
    const item = itemData.item;

    const storage = this.storageService.read();
    storage.cart.delete(item.id);
    this.storageService.write(storage);

    const groupIndex = this.$scope.groups.indexOf(group);
    const items = this.$scope.groups[groupIndex].itemData;
    const itemIndex = items.indexOf(itemData);

    items.splice(itemIndex, 1);

    if (items.length === 0) {
      this.$scope.groups.splice(groupIndex, 1);
    }
  }
}

CartController.$inject = [
  '$window',
  '$scope',
  '$q',
  '$state',
  'Event',
  'Organization',
  'ItemService',
  'ItemTransactionService',
  'StorageService',
  'UIService'
];

/*
{
    "_id": ObjectId("5753256724aa9a0046f768b5"),
    "className": "com.jivecake.api.model.EventItem",
    "eventId": ObjectId("5753252b24aa9a0046f768b4"),
    "name": "Roseboom Trio @ Orlando Balboa",
    "maximumPerUser": 23,
    "amount": 4,
    "timeAmounts": [],
    "status": 0,
    "timeStart": ISODate("2016-06-04T22:00:00Z"),
    "timeEnd": ISODate("2016-06-05T02:00:00Z"),
    "timeUpdated": ISODate("2016-07-15T01:01:18.804Z"),
    "timeCreated": ISODate("2016-06-04T19:00:55.413Z")
} {
    "_id": ObjectId("575e03d324aa9a004685ffc8"),
    "className": "com.jivecake.api.model.EventItem",
    "eventId": ObjectId("575e035e24aa9a004685ffc7"),
    "name": "Test Item",
    "maximumPerUser": 7,
    "amount": 0.25,
    "timeAmounts": [{
        "amount": 0.12,
        "after": ISODate("2016-07-04T06:00:00Z")
    }],
    "status": 0,
    "timeUpdated": ISODate("2016-07-29T14:24:29.338Z"),
    "timeCreated": ISODate("2016-06-13T00:52:35.419Z")
} {
    "_id": ObjectId("579b9b7224aa9a0046a222ba"),
    "className": "com.jivecake.api.model.EventItem",
    "eventId": ObjectId("579b9b1924aa9a0046a222b9"),
    "name": "Saturday Night Party",
    "description": "",
    "totalAvailible": 7,
    "maximumPerUser": 1,
    "amount": 0.05,
    "timeAmounts": [{
        "amount": 0.05,
        "after": ISODate("2016-07-05T01:20:00Z")
    }, {
        "amount": 0.04,
        "after": ISODate("2016-07-05T15:15:00Z")
    }],
    "status": 0,
    "timeStart": ISODate("2016-08-28T00:30:00Z"),
    "timeEnd": ISODate("2016-08-28T03:59:00Z"),
    "timeUpdated": ISODate("2016-08-05T03:32:20.927Z"),
    "timeCreated": ISODate("2016-07-29T18:07:46.442Z")
}
*/