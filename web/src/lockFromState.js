import settings from './settings';

export default (state) => {
  return new Auth0Lock(settings.oauth.auth0.client_id, settings.oauth.auth0.domain, {
    auth: {
      audience: `${settings.jivecakeapi.uri}/`,
      redirectUrl: location.origin + '/oauth/redirect',
      responseType: 'token id_token',
      params: {
        state: JSON.stringify(state),
        scope: 'openid profile email user_metadata'
      }
    },
    theme: {
      logo: '/assets/auth0/signin.png'
    },
    focusInput: false,
    rememberLastLogin: false,
    oidcConformant: true
  });
};