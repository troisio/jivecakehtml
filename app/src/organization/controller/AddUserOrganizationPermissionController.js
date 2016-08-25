export default class AddUserOrganizationPermissionController {
  constructor(
    $q,
    $window,
    $rootScope,
    $scope,
    $mdDialog,
    auth0Service,
    storageService,
    organizationService,
    permissionService,
    uiService,
    organization,
    Permission
  ) {
    this.$q = $q;
    this.$window = $window;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.auth0Service = auth0Service;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.organization = organization;
    this.Permission = Permission;

    this.storage = storageService.read();

    this.run();
  }

  run() {
    this.$scope.close = this.$mdDialog.hide;
    this.$scope.uiReady = false;
    this.$scope.loading = false;
    this.$scope.user_id = null;
    this.$scope.include = 1;
    this.$scope.permissions = {};

    this.permissionService.getTypes(this.storage.token).then((types) => {
      this.$scope.types = types.Organization;
      types.Organization.forEach((permission) => {
        this.$scope.permissions[permission] = false;
      });
    }).finally(() => {
      this.$scope.uiReady = true;
    });

    this.$scope.query = (search) => {
       const terms = search.split(new this.$window.RegExp('\\s+', 'g')).join(' ');
       const queryParts = ['user_metadata.given_name', 'user_metadata.family_name', 'given_name', 'family_name', 'email', 'name'].map(function(field) {
         return field + ':' + terms + '*';
       });

       const query = queryParts.join(' OR ');

       return this.auth0Service.searchUsers(this.storage.token, {
         q: query,
         search_engine: 'v2'
       });
    };

    this.$scope.changeInclusion = (inclusion) => {
      if (inclusion === 0) {
        this.$scope.types.forEach((type) => {
          this.$scope.permissions[type] = true;
        });
      }
    };

    this.$scope.submit = (user, permissions, include) => {
      this.$scope.loading = true;

      this.permissionService.search(this.storage.token, {
        objectId: this.organization.id,
        user_id: user.user_id
      }).then((permissionSearch) => {
        const currentUserPermissions = permissionSearch.entity;
        let future;

        if (currentUserPermissions.length > 0) {
            this.uiService.notify(user.given_name + ' is already a user of ' + this.organization.name);
            future = this.$q.resolve();
        } else {
          const permission = new this.Permission();
          permission.user_id = user.user_id;
          permission.objectClass = this.organizationService.getObjectClassName();
          permission.objectId = this.organization.id;
          permission.permissions = [];
          permission.include = include;

          if (include !== 0) {
            for (let key in permissions) {
              const value = permissions[key];

              if (value === true) {
                permission.permissions.push(key);
              }
            }
          }

          future = this.permissionService.write(this.storage.token, this.organization.id, [permission]).then((permissions) => {
            this.$rootScope.$broadcast('ORGANIZATION.PERMISSION.WRITE', permissions);
            this.$mdDialog.hide();

            this.uiService.notify('User added');
          }, () => {
            this.uiService.notify('Unable to add user to organization');
          });
        }

        return future;
      }).finally(() => {
        this.$scope.loading = false;
      });
    };
  }

  getAccountSuffix(user) {
    let result = '';

    const idKey = 'oauthId' in user ? 'oauthId' : 'user_id';

    if (user[idKey].startsWith('google')) {
      result = '(google)';
    } else if (user[idKey].startsWith('facebook')) {
      result = '(facebook)';
    }

    return result;
  }
}

AddUserOrganizationPermissionController.$inject = [
  '$q',
  '$window',
  '$rootScope',
  '$scope',
  '$mdDialog',
  'Auth0Service',
  'StorageService',
  'OrganizationService',
  'PermissionService',
  'UIService',
  'organization',
  'Permission'
];