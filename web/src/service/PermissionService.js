import Permission from '../class/Permission';
import URLSearchParams from 'url-search-params';

export default class PermissionService {
  constructor($http, settings, toolsService) {
    this.$http = $http;
    this.settings = settings;
    this.toolsService = toolsService;
  }

  search(token, query) {
    const params = new URLSearchParams();

    for (let key in query) {
      params.append(key, query[key]);
    }

    return fetch(`${this.settings.jivecakeapi.uri}/permission?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(data => {
      return Object.assign(data, {
        entity: data.entity.map((permission) => this.toolsService.toObject(permission, Permission))
      });
    });
  }

  delete(token, id) {
    return fetch(`${this.settings.jivecakeapi.uri}/permission/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}

PermissionService.$inject = ['$http', 'settings', 'ToolsService', 'UIService'];