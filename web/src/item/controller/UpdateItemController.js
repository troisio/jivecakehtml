import angular from 'angular';

export default class UpdateItemController {
  constructor(
    $rootScope,
    $scope,
    $state,
    storageService,
    eventService,
    paymentProfileService,
    itemService,
    uiService
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.eventService = eventService;
    this.paymentProfileService = paymentProfileService;
    this.itemService = itemService;
    this.uiService = uiService;

    this.$scope.selected = [];
    this.$scope.time = {};
    this.storage = storageService.read();
    this.$scope.timeSelections = this.uiService.getTimeSelections();
    this.$scope.currentDate = new Date();
    this.$scope.hours = Array.from(new Array(24), (item, index) => index);
    this.$scope.minutes = Array.from(new Array(60), (item, index) => index);

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    return this.itemService.read(this.storage.auth.idToken, this.$state.params.itemId).then((item) => {
      if (item.timeStart === null) {
        this.$scope.timeStart = {
          time: null,
          hour: null,
          minute: null
        };
      } else {
        this.$scope.timeStart = {
          time: new Date(item.timeStart)
        };

        this.$scope.timeStart.hour = this.$scope.timeStart.time.getHours();
        this.$scope.timeStart.minute = this.$scope.timeStart.time.getMinutes();
      }

      if (item.timeEnd === null) {
        this.$scope.timeEnd = {
          time: null,
          hour: null,
          minute: null
        };
      } else {
        this.$scope.timeEnd = {
          time: new Date(item.timeEnd)
        };

        this.$scope.timeEnd.hour = this.$scope.timeEnd.time.getHours();
        this.$scope.timeEnd.minute = this.$scope.timeEnd.time.getMinutes();
      }

      this.$scope.item = item;
      this.$scope.enableScheduledPriceModifications = item.timeAmounts !== null;
      this.$scope.itemName = item.name;
      this.$scope.free = item.amount === 0;
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  addTimeAmount(price, time) {
    const validTime = time.date instanceof Date && typeof time.hour === 'number' && typeof time.minute === 'number';
    const validPrice = typeof price === 'number';

    if (validTime && validPrice) {
      if (this.$scope.item.timeAmounts === null) {
        this.$scope.item.timeAmounts = [];
      }

      const date = new Date(time.date);
      date.setHours(time.hour);
      date.setMinutes(time.minute);

      this.$scope.item.timeAmounts.push({
        amount: price.toFixed(2),
        after: date.getTime()
      });

      this.$scope.amount = '';
      time.date = null;
      time.hour = null;
      time.minute = null;
    } else {
      if (!validTime) {
        this.uiService.notify('Please enter a valid time');
      } else if (!validPrice) {
        this.uiService.notify('Please enter a valid price');
      }
    }
  }

  submit(item, free, enableScheduledPriceModifications, timeStart, timeEnd) {
    const itemCopy = angular.copy(item);

    if (timeStart.time === null) {
      itemCopy.timeStart = null;
    } else {
      const date = new Date(timeStart.time);

      if (timeStart.hour === null) {
        date.setHours(0);
      } else {
        date.setHours(timeStart.hour);
      }

      if (timeStart.minute === null) {
        date.setMinutes(0);
      } else {
        date.setMinutes(timeStart.minute);
      }

      itemCopy.timeStart = date.getTime();
    }

    if (timeEnd.time === null) {
      itemCopy.timeEnd = null;
    } else {
      const date = new Date(timeEnd.time);

      if (timeEnd.hour === null) {
        date.setHours(0);
      } else {
        date.setHours(timeEnd.hour);
      }

      if (timeEnd.minute === null) {
        date.setMinutes(0);
      } else {
        date.setMinutes(timeEnd.minute);
      }

      itemCopy.timeEnd = date.getTime();
    }

    if (itemCopy.timeStart !== null && itemCopy.timeEnd !== null && itemCopy.timeStart > itemCopy.timeEnd) {
      this.uiService.notify('Start Time must be before End Time');
    } else {
      this.$scope.uiReady = false;

      if (free) {
        itemCopy.amount = null;
        itemCopy.timeAmounts = null;
        itemCopy.countAmounts = null;
      }

      if (!enableScheduledPriceModifications) {
        itemCopy.timeAmounts = null;
      }

      if (Array.isArray(itemCopy.timeAmounts) && itemCopy.timeAmounts.length === 0) {
        itemCopy.timeAmounts = null;
      }

      this.itemService.update(this.storage.auth.idToken, itemCopy).then(item => {
        this.$state.go('application.internal.item.read');
        this.uiService.notify('Updated ' + item.name);
      }, () => {
        this.uiService.notify('Unable to update item');
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    }
  }
}

UpdateItemController.$inject = [
  '$rootScope',
  '$scope',
  '$state',
  'StorageService',
  'EventService',
  'PaymentProfileService',
  'ItemService',
  'UIService'
];