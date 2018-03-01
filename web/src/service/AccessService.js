import lockFromState from '../lockFromState';

export default class AccessService {
  constructor($state, storageService, connectionService, settings) {
    this.$state = $state;
    this.storageService = storageService;
    this.connectionService = connectionService;
    this.settings = settings;
  }

  oauthSignIn() {
    const lock = lockFromState({
      name: this.$state.current.name,
      stateParams: this.$state.params
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
      href += '&access_token=' + storage.auth.accessToken;
    }

    location.href = href;
  }
}

AccessService.$inject = ['$state', 'StorageService', 'ConnectionService', 'settings'];