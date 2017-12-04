export default class ViewTransactionController {
  constructor($scope, storageService, paypalService, transactionService, event, item, transaction, user) {
    this.$scope = $scope;
    this.storageService = storageService;
    this.paypalService = paypalService;
    this.transactionService = transactionService;
    this.event = event;
    this.user = user;
    $scope.item = item;
    $scope.event = event;
    $scope.transaction = transaction;
    $scope.user = user;
    $scope.time = new Date();
    $scope.paypalManualAction = false;

    this.run();
  }

  run() {
    const storage = this.storageService.read();

    const eventData = this.event.userData.find(data => this.user != null && data.userId === this.user.user_id);
    this.$scope.userData = typeof eventData === 'undefined' ? null : eventData;

    const isPendingPaypal = this.$scope.transaction.status === this.transactionService.PENDING &&
      this.$scope.transaction.linkedObjectClass === 'PaypalPayment';

    if (isPendingPaypal) {
      this.paypalService.getPayment(storage.auth.idToken, this.$scope.transaction.id).then((payment) => {
        const sale = payment.transactions[0].related_resources[0].sale;

        if (sale.state === 'pending' && sale.reason_code === 'RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION') {
          this.$scope.paypalManualAction = true;
        }
      });
    }
  }
}

ViewTransactionController.$inject = [
  '$scope',
  'StorageService',
  'PaypalService',
  'TransactionService',
  'event',
  'item',
  'transaction',
  'user'
];