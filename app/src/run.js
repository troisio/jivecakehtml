export default [
  'lock',
  '$timeout',
  '$mdSidenav',
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
    $timeout,
    $mdSidenav,
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
    if (settings.google.analytics.enabled && window.ga) {
      ga('create', 'UA-81919203-1', 'auto');
    }

    $transitions.onSuccess({}, function() {
      if (settings.google.analytics.enabled && window.ga) {
        ga('send', 'pageview', $location.path());
      }
    });

    $transitions.onFinish({
      from: 'application.public.oauthRedirect',
      to: 'application.public.home'
    }, (transition) => {
      transition.promise.then(() => {
        const component = $mdSidenav('left');

        if (!component.isOpen()) {
          component.toggle();
          $timeout();
        }
      });
    });

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
            }, () => {
              uiService.notify('Sorry, we were unable to load your data');
              $state.go('application.public.home');
            });
          }, () => {
            uiService.notify('Sorry, we were unable to load your organizations');
            $state.go('application.public.home');
          });
        } else {
          uiService.notify('Sorry, we were unable to get your data from Auth0');
          $state.go('application.public.home');
        }
      });
    });
  }
]