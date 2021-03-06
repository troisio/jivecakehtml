export default class OAuthRedirectController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    paymentProfileService,
    storageService,
    permissionService,
    transactionService,
    eventService,
    organizationService,
    JiveCakeLocalStorage,
    SearchEntity,
    onAuthentication
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.paymentProfileService = paymentProfileService;
    this.storageService = storageService;
    this.permissionService = permissionService;
    this.transactionService = transactionService;
    this.eventService = eventService;
    this.organizationService = organizationService;
    this.JiveCakeLocalStorage = JiveCakeLocalStorage;
    this.SearchEntity = SearchEntity;

    onAuthentication.then((subject) => {
      this.onAuthenticated(subject.auth, null, subject.profile);
    }, (e) => {
      this.onAuthenticated(null, e, null);
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
      let future;

      if (this.$state.params.code === null) {
        future = Promise.resolve();
      } else {
        const storage = this.storageService.read();
        future = this.paymentProfileService.createStripePaymentProfile(storage.auth.accessToken, state.subject, {
          code: this.$state.params.code
        });
      }

      future.then(() => {}, () => {}).then(() => {
        this.$state.go(state.name, state.stateParams);
      });
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
      }, () => {
        location.href = '/';
      });
    };

    if (typeof error === 'undefined' || error === null) {
      const storage = this.storageService.read();
      storage.onBoarding = null;
      storage.auth = auth;
      storage.profile = profile;
      storage.timeUpdated = new Date().getTime();

      if (storage.timeCreated === null) {
        storage.timeCreated = new Date().getTime();
      }

      this.storageService.write(storage);

      this.permissionService.search(auth.accessToken, {
        user_id: auth.idTokenPayload.sub,
        objectClass: 'Organization'
      }).then((permissionResult) => {
        const permissions = permissionResult.entity;
        const organizationIds = permissions.map(permission => permission.objectId);

        const transactionFuture = organizationIds.length === 0 ? Promise.resolve(new this.SearchEntity()) :
          this.transactionService.search(auth.accessToken, {
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

          if (routerParameters !== null && routerParameters.name === 'application.event') {
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
      let message = 'Sorry, we were unable to get your personal data.';

      if (typeof error.errorDescription !== 'undefined') {
        message += ' ' + error.errorDescription;
      }

      unableToLoad(message);
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
  'EventService',
  'OrganizationService',
  'JiveCakeLocalStorage',
  'SearchEntity',
  'onAuthentication'
];