export default class OrganizationInvitationService {
  constructor(settings) {
    this.settings = settings;
  }

  getOrganizationInvitations(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${id}/invitation`;

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  getUserInvitations(token, userId) {
    const url = `${this.settings.jivecakeapi.uri}/user/${userId}/organizationInvitation`;

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  create(token, organizationId, body) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${organizationId}/invitation`;

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    });
  }

  accept(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/organizationInvitation/${id}/accept`;

    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  delete(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/organizationInvitation/${id}`;

    return fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }
}

OrganizationInvitationService.$inject = [
  'settings'
];