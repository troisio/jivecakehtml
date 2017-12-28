export default [
  'lock',
  '$rootScope',
  '$timeout',
  '$mdSidenav',
  '$transitions',
  '$location',
  '$state',
  '$mdDialog',
  'settings',
  function(
    lock,
    $rootScope,
    $timeout,
    $mdSidenav,
    $transitions,
    $location,
    $state,
    $mdDialog,
    settings
  ) {
    if (settings.google.analytics.enabled && window.ga) {
      ga('create', 'UA-81919203-1', 'auto');
    }
/*
  open side nav on first login, this is not the correct logic
  needs to implemented for first time login, for user without organization and without
  invitation to organization
*/
    $transitions.onFinish({
      from: 'application.oauthRedirect',
      to: ''
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