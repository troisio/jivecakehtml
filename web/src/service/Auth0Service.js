import settings from '../settings';

export default class Auth0Service {
  updateUser(token, user_id, body) {
    return fetch(`${settings.jivecakeapi.uri}/auth0/api/v2/users/${user_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  sendVerificationEmail(token, body) {
    return fetch(`${settings.jivecakeapi.uri}/auth0/api/v2/jobs/verification-email`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  getUser(token, id) {
    return fetch(`${settings.jivecakeapi.uri}/auth0/api/v2/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }
}