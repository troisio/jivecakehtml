export default class PermissionService {
  constructor($http, Item, Permission, settings, toolsService) {
    this.$http = $http;
    this.Item = Item;
    this.Permission = Permission;
    this.settings = settings;
    this.toolsService = toolsService;

    this.settings = settings;
    this.permissionTypes = [
      {'class': 'Application', permissions: [0, 1]},
      {'class': 'Organization', permissions: [0, 1]}
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
        entity: response.data.entity.map(this.toObject, this),
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
    }).then((response) => response.data.map(this.toObject, this));
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
}

PermissionService.$inject = ['$http', 'Item', 'Permission', 'settings', 'ToolsService'];