import angular from 'angular';

export default class AccessService {
  constructor($state, storageService, connectionService, settings) {
    this.$state = $state;
    this.storageService = storageService;
    this.connectionService = connectionService;
    this.settings = settings;
  }

  oauthSignIn() {
    const redirectUrl = location.origin + '/oauth/redirect';
    const state = angular.toJson({
      name: this.$state.current.name,
      stateParams: this.$state.params
    });

    const lock = new Auth0Lock(this.settings.oauth.auth0.client_id, this.settings.oauth.auth0.domain, {
      auth: {
        redirectUrl: redirectUrl,
        responseType: 'token',
        params: {
          state: state,
          scope: 'openid email'
        }
      },
      theme: {
        logo: '/assets/auth0/signin.png'
      },
      focusInput: false,
      rememberLastLogin: false
    });

    lock.show();
  }

  logout() {
    const storage = this.storageService.read();
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    this.storageService.reset();

    let returnTo;

    if (storage.auth !== null && storage.auth.idTokenPayload.sub.startsWith('facebook')) {
      returnTo = encodeURIComponent(location.origin);
    } else {
      returnTo = location.origin;
    }

    let href = 'https://' + this.settings.oauth.auth0.domain + '/v2/logout' +
      '?returnTo=' + returnTo +
      '&client_id=' + this.settings.oauth.auth0.client_id;

    if (storage.auth !== null) {
      href += '&access_token=' + storage.auth.idToken;
    }

    location.href = href;
  }
}

AccessService.$inject = ['$state', 'StorageService', 'ConnectionService', 'settings'];