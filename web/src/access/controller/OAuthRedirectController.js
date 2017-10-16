export default class OAuthRedirectController {
  constructor($scope, $state, $mdDialog, paymentProfileService, storageService, permissionService, transactionService, JiveCakeLocalStorage, SearchEntity) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.paymentProfileService = paymentProfileService;
    this.storageService = storageService;
    this.permissionService = permissionService;
    this.transactionService = transactionService;
    this.JiveCakeLocalStorage = JiveCakeLocalStorage;
    this.SearchEntity = SearchEntity;

    this.$scope.$on('auth0.authenticated', (_, subject) => {
      this.onAuthenticated(subject.auth, subject.error, subject.profile);
    });

    this.$scope.$parent.ready.then(() => this.run());
  }

  run() {
    let state;

    try {
      state = JSON.parse(this.$state.params.state);
    } catch (e) {
      state = null;
    }

    if (state !== null && state.flow === 'stripe') {
      if (this.$state.params.code !== null) {
        const storage = this.storageService.read();
        this.paymentProfileService.createStripePaymentProfile(storage.auth.idToken, state.subject, {
          code: this.$state.params.code
        });
      }

      this.$state.go(state.name, state.stateParams);
    }
  }

  onAuthenticated(auth, error, profile) {
    const unableToLoad = (text) => {
      const confirm = this.$mdDialog.confirm()
        .title(text)
        .ariaLabel('Unable to load data')
        .clickOutsideToClose(false)
        .ok('Ok');

      this.$mdDialog.show(confirm).then(() => {
        location.href = '/';
      });
    };

    if (typeof error === 'undefined' || error === null) {
      const storage = new this.JiveCakeLocalStorage();
      storage.timeCreated = new Date().getTime();
      storage.auth = auth;
      storage.profile = profile;
      this.storageService.write(storage);
      this.permissionService.search(auth.idToken, {
        user_id: auth.idTokenPayload.sub,
        objectClass: 'Organization'
      }).then((permissionResult) => {
        const permissions = permissionResult.entity;
        const organizationIds = permissions.map(permission => permission.objectId);

        const transactionFuture = organizationIds.length === 0 ? Promise.resolve(new this.SearchEntity()) :
          this.transactionService.search(auth.idToken, {
            limit: 1,
            organizationId: organizationIds,
            order: '-timeCreated'
          });

        transactionFuture.then(transactionSearch => {
          const millisecondsPerWeek = 604800000;
          const currentTime = new Date().getTime();
          const transactionsInPreviousWeek = transactionSearch.entity
            .filter(transaction => currentTime - transaction.timeCreated < millisecondsPerWeek);

          const routerParameters = typeof auth.state === 'undefined' ? null : JSON.parse(auth.state);

          if (routerParameters !== null && routerParameters.name === 'application.public.event') {
            this.$state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
          } else if (transactionsInPreviousWeek.length > 0) {
            this.$state.go('application.internal.transaction.read', {}, {reload: true});
          } else if (permissions.length > 0) {
            this.$state.go('application.internal.organization.read', {}, {reload: true});
          } else if (routerParameters === null) {
            this.$state.go('application.internal.myTransaction', {
              user_id: auth.idTokenPayload.sub
            }, {
              reload: true
            });
          } else {
            if (routerParameters.name === 'landing') {
              this.$state.go('application.internal.myTransaction', {
                user_id: auth.idTokenPayload.sub
              }, {
                reload: true
              });
            } else {
              this.$state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
            }
          }
        }, () => {
          unableToLoad('Sorry, we were unable to load your data');
        });
      }, () => {
        unableToLoad('Sorry, we were unable to load your organizations');
      });
    } else {
      unableToLoad('Sorry, we were unable to get your data from Auth0');
    }
  }
}

OAuthRedirectController.$inject = [
  '$scope',
  '$state',
  '$mdDialog',
  'PaymentProfileService',
  'StorageService',
  'PermissionService',
  'TransactionService',
  'JiveCakeLocalStorage',
  'SearchEntity'
];