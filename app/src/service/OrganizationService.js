export default class OrganizationService {
  constructor($window, $http, Organization, settings, eventService, permissionService, toolsService, SubscriptionPaymentDetail) {
    this.$window = $window;
    this.$http = $http;
    this.Organization = Organization;
    this.settings = settings;
    this.eventService = eventService;
    this.permissionService = permissionService;
    this.toolsService = toolsService;
  }

  getObjectClassName() {
    return 'Organization';
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
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  create(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization'].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  update(token, organization) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organization.id].join('/');

    return this.$http.post(url, organization, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  publicSearch(params) {
    const url = [this.settings.jivecakeapi.uri, 'organization', 'search'].join('/');

    return this.$http.get(url, {
      params : params
    }).then((response) => {
      return {
        entity: this.toObjects(response.data.entity),
        count: response.data.count
      };
    });
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
        entity: this.toObjects(response.data.entity),
        count: response.data.count
      };
    });
  }

  read(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  getOrganizationsByUser(token, user_id) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'organization'].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(response => response.data.map(this.toObject, this));
  }

  getOrganizationsWithPermissions(organizations, permissions) {
    const organizationIdToData = {};

    const derivePermissions = (permission) => {
      const set = new Set();

      if (permission.include === 0) {
        set.add(this.getReadPermission());
        set.add(this.getWritePermission());
      } else if (permission.include === 1) {
        permission.permissions.forEach(function(p) {
          set.add(p);
        });
      } else if (permission.include === 2) {
        set.add(this.getReadPermission());
        set.add(this.getWritePermission());

        permission.permissions.forEach(function(p) {
          set.delete(p);
        });
      }

      return set;
    };

    organizations.forEach(function(organization) {
      organizationIdToData[organization.id] = {organization: organization, permissions: null};
    });

    permissions.forEach((permission) => {
      if (permission.objectClass === this.getObjectClassName()) {
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

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Organization);
  }

  toObjects(subject) {
    return subject.map(this.toObject, this);
  }
}

OrganizationService.$inject = ['$window', '$http', 'Organization', 'settings', 'EventService', 'PermissionService', 'ToolsService'];