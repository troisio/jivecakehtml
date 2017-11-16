export default class OrganizationService {
  constructor($window, $http, Organization, settings, eventService, permissionService, toolsService) {
    this.$window = $window;
    this.$http = $http;
    this.Organization = Organization;
    this.settings = settings;
    this.eventService = eventService;
    this.permissionService = permissionService;
    this.toolsService = toolsService;

    this.rootOrganization = new Organization();
    this.rootOrganization.id = '55865027c1fcce003aa0aa40';
    this.rootOrganization.children = [];
    this.rootOrganization.name = "JiveCake";
    this.rootOrganization.email = "luis@trois.io";
  }

  getTree(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id, 'tree'].join('/');

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }

  getReadPermission() {
    return 0;
  }

  getWritePermission() {
    return 1;
  }

  delete(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Organization));
  }

  create(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization'].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Organization));
  }

  update(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organization.id].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => this.toolsService.toObject(response.data, this.Organization));
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'organization'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization : 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: response.data.entity.map(entity => {
          return this.toolsService.toObject(entity, this.Organization);
        }),
        count: response.data.count
      };
    });
  }

  read(id) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${id}`;
    return fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(data => this.toolsService.toObject(data, this.Organization));
  }

  getOrganizationsByUser(token, user_id, params) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'organization'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data.map(entity => this.toolsService.toObject(entity, this.Organization)));
  }

  getOrganizationsWithPermissions(organizations, permissions) {
    const organizationIdToData = {};

    const derivePermissions = (permission) => {
      const set = new Set();

      if (permission.include === 0) {
        set.add(this.getReadPermission());
        set.add(this.getWritePermission());
      } else if (permission.include === 1) {
        permission.permissions.forEach(set.add, set);
      } else if (permission.include === 2) {
        set.add(this.getReadPermission());
        set.add(this.getWritePermission());

        permission.permissions.forEach(set.delete, set);
      }

      return set;
    };

    organizations.forEach(function(organization) {
      organizationIdToData[organization.id] = {organization: organization, permissions: null};
    });

    permissions.forEach((permission) => {
      if (permission.objectClass === 'Organization') {
        const organizationData = organizationIdToData[permission.objectId];

        organizationData.permissions = derivePermissions(permission);

        organizationData.organization.children.forEach(function(childId) {
          const childData = organizationIdToData[childId];
          childData.permissions = organizationData.permissions;
        });
      }
    });

    return organizations.map(organization => organizationIdToData[organization.id]);
  }

  getUsers(token, id) {
    const url = `${this.settings.jivecakeapi.uri}/organization/${id}/user`;

    return fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.ok ? response.json() : Promise.reject(response));
  }
}

OrganizationService.$inject = ['$window', '$http', 'Organization', 'settings', 'EventService', 'PermissionService', 'ToolsService'];