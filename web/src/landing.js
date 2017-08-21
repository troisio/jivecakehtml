import 'whatwg-fetch';
import settings from './settings';
import StorageService from './service/StorageService';
import JiveCakeLocalStorage from './class/JiveCakeLocalStorage';
import UrlSearchParams from 'url-search-params';

const storageService = new StorageService(JiveCakeLocalStorage);
const storage = storageService.read();

const hasOrganizaitons = (auth) => {
  const params = new UrlSearchParams();
  params.append('user_id', auth.idTokenPayload.sub);
  const path = [settings.jivecakeapi.uri, 'permission'].join('/') + '?' + params.toString();

  return fetch(path, {
    headers: {
      Authorization: 'Bearer ' + auth.idToken
    }
  })
  .then(response => response.ok ? response.json() : false)
  .then(searchResult => searchResult.entity.length > 0);
};

if (storage.auth !== null) {
  const expired = new Date() > new Date(storage.auth.idTokenPayload.exp * 1000);

  if (expired) {
    storageService.write(new JiveCakeLocalStorage());
  }
}

const onLogin = (e) => {
  e.preventDefault();

  const storage = storageService.read();

  if (storage.auth === null) {
    lock.show();
  } else {
    const expired = new Date() > new Date(storage.auth.idTokenPayload.exp * 1000);

    if (expired) {
      storageService.write(new JiveCakeLocalStorage());
      lock.show();
    } else {
      hasOrganizaitons(storage.auth).then((hasOrganizaitons) => {
        if (hasOrganizaitons) {
          location.href = '/organization';
        } else {
          location.href = '/transaction/' + storage.auth.idTokenPayload.sub;
        }
      });
    }
  }
}

const state = JSON.stringify({
  name: 'landing',
  stateParams: {}
});
const redirectUrl = location.origin + '/oauth/redirect';
const lock = new Auth0Lock(settings.oauth.auth0.client_id, settings.oauth.auth0.domain, {
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

$(document).ready(() => {
  const elements = document.querySelectorAll('a.login');

  for (let element of elements) {
    element.addEventListener('click', onLogin);
  }
});