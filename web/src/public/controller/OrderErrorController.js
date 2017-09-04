export default class OrderErrorController {
  constructor($scope, errors) {
    this.$scope = $scope;
    this.errors = errors;
    this.messages = [
      {
        error: 'nameRequired',
        message: 'First and last name required'
      },
      {
        error: 'photoRequired',
        message: 'Your photo is required. Please upload a photo to your account'
      },
      {
        error: 'emailRequired',
        message: 'Email is required'
      },
      {
        error: 'profile',
        message: 'Invalid payment profile'
      },
      {
        error: 'userId',
        message: 'You must be logged in to complete your order'
      },
      {
        error: 'eventNotActive',
        message: 'You attempted to pay for an event that is not active'
      },
      {
        error: 'itemNotActive',
        message: 'You attempted to pay for inactive items'
      },
      {
        error: 'itemNotFound',
        message: 'You attempted to pay for items we can not find'
      },
      {
        error: 'totalAvailible',
        message: 'Your order contains items which are sold out'
      },
      {
        error: 'maximumPerUser',
        message: 'You reached your item capacity for some items'
      },
      {
        error: 'duplicateItems',
        message: 'You have duplicate items in your order'
      },
      {
        error: 'empty',
        message: 'Your order is empty'
      },
      {
        error: 'eventNotActive',
        message: 'The event you are trying to access is no longer active'
      }
    ];

    this.run();
  }

  run() {
    const set = new Set();

    for (let error of this.errors) {
      set.add(error.error);
    }

    this.$scope.messages = this.messages.filter(error => set.has(error.error));
  }
}

OrderErrorController.$inject = [
  '$scope',
  'errors'
];