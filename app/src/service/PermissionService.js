export default class PermissionService {
  constructor($http, Item, Permission, settings, toolsService) {
    this.$http = $http;
    this.Item = Item;
    this.Permission = Permission;
    this.settings = settings;
    this.toolsService = toolsService;

    this.ALL = 0;
    this.INCLUDE = 1;
    this.EXCLUDE = 2;

    this.READ = 0;
    this.WRITE = 1;

    this.settings = settings;
    this.permissionTypes = [
      {'class': 'Application', permissions: [this.READ, this.WRITE]},
      {'class': 'Organization', permissions: [this.READ, this.WRITE]}
    ];
  }

  getTypes() {
    return this.permissionTypes;
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
        entity: response.data.entity.map((permission) => {
          return this.toolsService.toObject(permission, this.Permission);
        }),
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
    }).then((response) => response.data.map((permission) => {
      return this.toolsService.toObject(permission, this.Permission);
    }));
  }

  delete(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'permission'].join('/');

    return this.$http.delete(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }
}

PermissionService.$inject = ['$http', 'Item', 'Permission', 'settings', 'ToolsService'];