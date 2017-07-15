export default [
  'lock',
  '$transitions',
  '$location',
  '$state',
  '$q',
  '$mdDialog',
  'OrganizationService',
  'PermissionService',
  'TransactionService',
  'UIService',
  'StorageService',
  'Auth0Service',
  'JiveCakeLocalStorage',
  'SearchEntity',
  'UserInterfaceEvent',
  'settings',
  function(
    lock,
    $transitions,
    $location,
    $state,
    $q,
    $mdDialog,
    organizationService,
    permissionService,
    transactionService,
    uiService,
    storageService,
    auth0Service,
    JiveCakeLocalStorage,
    SearchEntity,
    UserInterfaceEvent,
    settings
  ) {
    if (settings.google.analytics.enabled) {
      ga('create', 'UA-81919203-1', 'auto');
    }

    $transitions.onSuccess({}, function() {
      if (settings.google.analytics.enabled) {
        ga('send', 'pageview', $location.path());
      }
    });

    document.addEventListener('visibilitychange', function() {
      const storage = storageService.read();
      const token = storage.auth === null ? null : storage.auth.idToken;
      const event = new UserInterfaceEvent();
      event.event = 'visibilitychange';
      event.parameters = {
        visibilityState: document.visibilityState
      };
      uiService.logInteraction(token, event);
    });

    const loginFailure = function() {
      uiService.notify('Sorry, there was an error during login');
      $state.go('application.public.home');
    };

    lock.on('authenticated', function(auth) {
      lock.getUserInfo(auth.accessToken, function(error, profile) {
        if (typeof error === 'undefined' || error === null) {
          const storage = new JiveCakeLocalStorage();
          storage.timeCreated = new Date().getTime();
          storage.auth = auth;
          storage.profile = profile;
          storageService.write(storage);

          permissionService.search(auth.idToken, {
            user_id: auth.idTokenPayload.sub,
            objectClass: 'Organization'
          }).then(function(permissionResult) {
            const permissions = permissionResult.entity;
            const organizationIds = permissions.map(permission => permission.objectId);

            const transactionFuture = organizationIds.length === 0 ? $q.resolve(new SearchEntity()) :
              transactionService.search(auth.idToken, {
                limit: 1,
                organizationId: organizationIds,
                order: '-timeCreated'
              });

            transactionFuture.then(transactionSearch => {
              const millisecondsPerWeek = 604800000;
              const currentTime = new Date().getTime();
              const transactionsInPreviousWeek = transactionSearch.entity.filter(transaction => currentTime - transaction.timeCreated < millisecondsPerWeek);

              const routerParameters = typeof auth.state === 'undefined' ? null : JSON.parse(auth.state);

              if (routerParameters !== null && routerParameters.name === 'application.public.event') {
                $state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
              } else if (transactionsInPreviousWeek.length > 0) {
                $state.go('application.internal.transaction.read', {}, {reload: true});
              } else if (permissions.length > 0) {
                $state.go('application.internal.organization.read', {}, {reload: true});
              } else if (routerParameters === null) {
                $state.go('application.internal.myTransaction', {
                  user_id: auth.idTokenPayload.sub
                }, {
                  reload: true
                });
              } else {
                $state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
              }
            }, loginFailure);
          }, loginFailure);
        } else {
          loginFailure();
        }
      });
    }, loginFailure);
  }
]