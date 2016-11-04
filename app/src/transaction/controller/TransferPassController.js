export default class TransferPassController {
  constructor($window, $mdDialog, $scope, uiService, itemTransactionService, auth0Service, storageService, transaction) {
    this.$window = $window;
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.uiService = uiService;
    this.itemTransactionService = itemTransactionService;
    this.auth0Service = auth0Service;
    this.transaction = transaction;

    this.storage = storageService.read();
    this.$scope.loading = false;
    this.$scope.user = null;
  }

  query(search) {
     const terms = search.split(new this.$window.RegExp('\\s+', 'g')).join(' ');
     const queryParts = ['user_metadata.given_name', 'user_metadata.family_name', 'given_name', 'family_name', 'email', 'name'].map(function(field) {
       return field + ':' + terms + '*';
     });

     const query = queryParts.join(' OR ');

     return this.auth0Service.searchUsers(this.storage.token, {
       q: query,
       search_engine: 'v2'
     });
  }

  submit(user) {
    if (user !== null) {
      this.itemTransactionService.transfer(this.storage.token, this.transaction.id, user.user_id).then(() => {
        this.uiService.notify('Transfer successful');
      }, () => {
        this.uiService.notify('Unable to transfer');
      }).finally(() => {
        this.$mdDialog.hide();
      });
    }
  }
}

TransferPassController.$inject = ['$window', '$mdDialog', '$scope', 'UIService', 'ItemTransactionService', 'Auth0Service', 'StorageService', 'transaction'];