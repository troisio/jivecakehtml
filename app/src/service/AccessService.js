export default class AccessService {
  constructor(angular, auth, $state, $window, storageService, connectionService, settings) {
    this.angular = angular;
    this.auth = auth;
    this.$state = $state;
    this.$window = $window;
    this.storageService = storageService;
    this.connectionService = connectionService;
    this.settings = settings;
  }

  oauthSignIn() {
    const callbackUrl = this.$window.location.origin + '/oauth/redirect';
    const state = this.angular.toJson({
      name: this.$state.current.name,
      stateParams: this.$state.params
    });

    this.auth.signin({
      callbackURL: callbackUrl,
      responseType: 'token',
      icon: '/assets/auth0/signin.png',
      focusInput: false,
      rememberLastLogin: false,
      authParams: {
        state: state
      }
    });
  }

  logout() {
    const storage = this.storageService.read();
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    this.storageService.reset();

     let returnTo;

     if (storage.profile !== null && storage.profile.user_id.startsWith('facebook')) {
       returnTo = this.$window.encodeURIComponent(this.$window.location.origin);
     } else {
       returnTo = this.$window.location.origin;
     }

     let href = 'https://' + this.settings.oauth.auth0.domain + '/v2/logout' +
                '?returnTo=' + returnTo +
                '&client_id=' + this.settings.oauth.auth0.client_id;

    if (storage.token !== null) {
      href += '&access_token=' + storage.token;
    }

     this.$window.location.href = href;
  }
}

AccessService.$inject = ['angular', 'auth', '$state', '$window', 'StorageService', 'ConnectionService', 'settings'];