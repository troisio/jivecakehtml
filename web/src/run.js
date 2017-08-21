export default [
  'lock',
  '$rootScope',
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
  'settings',
  function(
    lock,
    $rootScope,
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
    settings
  ) {
    if (settings.google.analytics.enabled && window.ga) {
      ga('create', 'UA-81919203-1', 'auto');
    }

    $transitions.onFinish({
      from: 'application.public.oauthRedirect',
      to: 'application.public.home'
    }, (transition) => {
      transition.promise.then(() => {
        $timeout(() => {
          const component = $mdSidenav('left');

          if (!component.isOpen()) {
            component.toggle();
          }
        });
      });
    });

    $transitions.onSuccess({}, function() {
      if (settings.google.analytics.enabled && window.ga) {
        ga('send', 'pageview', $location.path());
      }
    });

    lock.on('authenticated', function(auth) {
      lock.getUserInfo(auth.accessToken, function(error, profile) {
        $rootScope.$broadcast('auth0.authenticated', {auth: auth, error: error, profile: profile});
      });
    });
  }
]