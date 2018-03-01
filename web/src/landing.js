import 'babel-polyfill';
import 'whatwg-fetch';
import lockFromState from './lockFromState';
import settings from './settings';
import StorageService from './service/StorageService';
import JiveCakeLocalStorage from './class/JiveCakeLocalStorage';
import UrlSearchParams from 'url-search-params';

const storageService = new StorageService(JiveCakeLocalStorage);
const storage = storageService.read();

const hasOrganizations = (auth) => {
  const params = new UrlSearchParams();
  params.append('user_id', auth.idTokenPayload.sub);
  return fetch(`${settings.jivecakeapi.uri}/permission?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`
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

  const lock = lockFromState({
    name: 'landing',
    stateParams: {}
  });
  const storage = storageService.read();

  if (storage.auth === null) {
    lock.show();
  } else {
    const expired = new Date() > new Date(storage.auth.idTokenPayload.exp * 1000);

    if (expired) {
      storageService.write(new JiveCakeLocalStorage());
      lock.show();
    } else {
      hasOrganizations(storage.auth).then((hasOrganizations) => {
        if (hasOrganizations) {
          location.href = '/organization';
        } else {
          location.href = '/transaction/' + storage.auth.idTokenPayload.sub;
        }
      });
    }
  }
}

$(document).ready(() => {
  const memoizedEventSearch = {};
  const input = document.querySelector('#main input');
  const noResults = document.querySelector('.no-results');

  if (input !== null) {
    input.oninput = () => {
      let future;

      if (input.value in memoizedEventSearch) {
        future = Promise.resolve(memoizedEventSearch[input.value]);
      } else {
        future = fetch(`${settings.jivecakeapi.uri}/event/search?limit=3&text=${input.value}`)
          .then(
            response => response.ok ? response.json() : {entity: []},
            () => ({entity: []})
          );
      }

      future.then((search) => {
        memoizedEventSearch[input.value] = search;

        const source = search.entity.map(event => ({
          id: event.hash,
          name: event.name
        }));

        $(input).typeahead({
          afterSelect: (event) => {
            if (event.id !== null) {
              location.href = `/e/${event.id}`;
            }
          },
          source: source
        });

        noResults.querySelector('p').style.display = source.length === 0 && input.value.length > 0 ? 'block' : 'none';
      });
    };
  }

  const elements = document.querySelectorAll('a.login');

  for (let element of elements) {
    element.addEventListener('click', onLogin);
  }

  const signupForm = document.querySelector('.blog .signup-form');

  if (signupForm !== null) {
    const storage = storageService.read();

    if (storage.auth === null) {
      const div = document.querySelector('div.signup');
      div.style.display = 'block';
    }
  }
});