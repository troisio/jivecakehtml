import 'whatwg-fetch';
import settings from './settings';
import StorageService from './service/StorageService';
import JiveCakeLocalStorage from './class/JiveCakeLocalStorage';
import UrlSearchParams from 'url-search-params';

const storageService = new StorageService(JiveCakeLocalStorage);
const storage = storageService.read();

if (storage.auth !== null && storage.auth.idTokenPayload.iat <= (1513986891252 / 1000)) {
  storageService.reset();
}

const hasOrganizations = (auth) => {
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

const initializeOnBoading = (form) => {
  const email = form.querySelector('#email');
  const eventName = form.querySelector('#eventName');
  const organizationName = form.querySelector('#organizationName');
  const sameAsEvent = form.querySelector('#sameAsEvent');
  const emailTaken = form.querySelector('.email-taken');
  const memoizeEmails = {};
  let emailAvailable = false;

  form.onsubmit = (e) => {
    e.preventDefault();

    if (!emailAvailable) {
      return;
    }

    const storage = storageService.read();
    storage.timeUpdated = new Date().getTime();
    storage.onBoarding = {
      event: {
        name: eventName.value,
        status: 0
      },
      organization: {
        name: organizationName.value,
        email: email.value
      }
    };

    if (storage.timeCreated === null) {
      storage.timeCreated = new Date().getTime();
    }

    storageService.write(storage);

    onLogin(e);
  };

  email.oninput = (e) => {
    const email = e.target.value;
    const url = `${settings.jivecakeapi.uri}/organization/search?email=${email}`;

    let searchFuture;

    if (email in memoizeEmails) {
      searchFuture = Promise.resolve(memoizeEmails[email]);
    } else {
      searchFuture = fetch(url).then(response => response.ok ? response.json() : Promise.reject(response));
    }

    searchFuture.then((searchResult) => {
      memoizeEmails[email] = searchResult;

      if (searchResult.count > 0) {
        emailTaken.style.display = 'block';
        emailAvailable = false;
      } else {
        emailTaken.style.display = 'none';
        emailAvailable = true;
      }
    }, () => {
      emailTaken.style.display = 'none';
      emailAvailable = true;
    });
  };

  sameAsEvent.onchange = () => {
    organizationName.disabled = sameAsEvent.checked;

    if (sameAsEvent.checked) {
      organizationName.value = eventName.value;
    } else {
      organizationName.value = '';
    }
  };

  eventName.oninput = (e) => {
    if (sameAsEvent.checked) {
      organizationName.value = e.target.value;
    }
  }
};

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
    initializeOnBoading(signupForm);
    const storage = storageService.read();

    if (storage.auth === null) {
      const div = document.querySelector('div.signup');
      div.style.display = 'block';
    }
  }
});