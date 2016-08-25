export default class PermissionService {
  constructor($http, Item, Permission, settings, toolsService) {
    this.$http = $http;
    this.Item = Item;
    this.Permission = Permission;
    this.settings = settings;
    this.toolsService = toolsService;

    this.settings = settings;
  }

  getTypes(token) {
    const url = [this.settings.jivecakeapi.uri, 'permission', 'type'].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function(response){
      return response.data;
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'permission'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: this.toObjects(response.data.entity),
        count: response.data.count
      };
    });
  }

  write(token, organizationId, permissions) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'permission'].join('/');

    return this.$http.post(url, permissions, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((data) => {
      return this.toObject(data.data);
    });
  }

  delete(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'permission'].join('/');

    return this.$http.delete(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  getIncludeAllPermissionType() {
    return 0;
  }

  getIncludePermissionType() {
    return 1;
  }

  getExcludePermissionType() {
    return 2;
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Permission);
  }

  toObjects(subject) {
    return subject.map(this.toObject, this);
  }
}

PermissionService.$inject = ['$http', 'Item', 'Permission', 'settings', 'ToolsService'];