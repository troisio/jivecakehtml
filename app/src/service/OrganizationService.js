export default class OrganizationService {
  constructor($window, $http, Organization, settings, eventService, permissionService, toolsService, SubscriptionPaymentDetail, IndexedOrganizationNode) {
    this.$window = $window;
    this.$http = $http;
    this.Organization = Organization;
    this.settings = settings;
    this.eventService = eventService;
    this.permissionService = permissionService;
    this.toolsService = toolsService;
    this.SubscriptionPaymentDetail = SubscriptionPaymentDetail;
    this.IndexedOrganizationNode = IndexedOrganizationNode;

    this.organizationFields = Object.keys(new Organization());

    this.organizationClassPermissions = [
      this.getReadPermission(),
      this.getWritePermission()
    ];
  }

  getOrganizationArrayWithPermissions(token, user_id) {
    return this.getOrganizationTreeWithPermissions(token, user_id).then((roots) => {
      const organizations = [];

      while (roots.length !== 0) {
        const data = roots.shift();
        roots.push.apply(roots, data.children);
        organizations.push(data);
      }

      return organizations;
    });
  }

  getOrganizationTreeWithPermissions(token, user_id) {
    return this.permissionService.search(token, {
      user_id: user_id
    }).then((result) => {
      const permissions = result.entity;

      const organizationPermissions = permissions.filter(permission => permission.objectClass === this.getObjectClassName());

      const permissionSets = organizationPermissions.reduce((map, permission) => {
        const set = new this.$window.Set();

        if (permission.include === 0) {
          this.organizationClassPermissions.forEach(set.add, set);
        } else if (permission.include === 1) {
          permission.permissions.forEach(set.add, set);
        } else if (permission.include === 2) {
          this.organizationClassPermissions.filter(classPermission => !permission.permissions.includes(classPermission))
                                           .forEach(set.add, set);
        }


        map[permission.objectId] = set;
        return map;
      }, {});

      const organizationIds = organizationPermissions.map(permission => permission.objectId);

      return this.searchIndex(token, {
        parentIds: organizationIds
      }).then((result) => {
        const ids = new this.$window.Set();

        result.entity.forEach(function(node) {
          ids.add(node.organizationId);
        });

        organizationIds.forEach(function(id) {
          ids.add(id);
        });

        return this.search(token, {
          id: this.$window.Array.from(ids)
        }).then((result) => {
          const vertices = result.entity.map((organization) => {
            return {
              organization: organization,
              parent: null,
              children: [],
              permissions: organization.id in permissionSets ? permissionSets[organization.id]: new this.$window.Set()
            };
          });

          const verticesByOrganizationId = vertices.reduce(function(map, vertex) {
            map[vertex.organization.id] = vertex;
            return map;
          }, {});

          vertices.forEach(function(vertex) {
            if (vertex.organization.parentId !== null) {
              if (vertex.organization.parentId in verticesByOrganizationId) {
                const parent = verticesByOrganizationId[vertex.organization.parentId];
                vertex.parent = parent;
                parent.children.push(vertex);
              }
            }
          });

          const roots = vertices.filter(vertex => !(vertex.organization.parentId in verticesByOrganizationId) || vertex.organization.parentId === null);

          roots.forEach(function(root) {
            const queue = [root];

            while (queue.length !== 0) {
              const node = queue.shift();
              for (let index = 0; index < node.children.length; index++) {
                const child = node.children[index];

                for (let permisison of node.permissions) {
                  child.permissions.add(permisison);
                }

                queue.push(child);
              }
            }
          });

          return roots;
        });
      });
    });
  }

  getTree(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id, 'tree'].join('/');

    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function(response) {
      return response.data;
    });
  }

  getObjectClassName() {
    return 'Organization';
  }

  getReadPermission() {
    return 'READ';
  }

  getWritePermission() {
    return 'WRITE';
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

  createSubscriptionPaymentDetail(token, organizationId, subscriptionDetail) {
    const url = [this.settings.jivecakeapi.uri, 'organization', organizationId, 'payment', 'detail'].join('/');

    return this.$http.post(url, subscriptionDetail, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toolsService.toObject(response.data, this.SubscriptionPaymentDetail);
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

  searchIndex(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'organization', 'index'].join('/');

    return this.$http.get(url, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return {
        entity: response.data.entity.map((subject) => {
          return this.toolsService.toObject(subject, this.IndexedOrganizationNode);
        }),
        count: response.data.count
      };
    });
  }

  toObject(subject) {
    return this.toolsService.toObject(subject, this.Organization);
  }

  toObjects(subject) {
    return subject.map(this.toObject, this);
  }
}

OrganizationService.$inject = ['$window', '$http', 'Organization', 'settings', 'EventService', 'PermissionService', 'ToolsService', 'SubscriptionPaymentDetail', 'IndexedOrganizationNode'];