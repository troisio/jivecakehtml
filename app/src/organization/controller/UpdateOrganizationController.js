export default class UpdateOrganizationController {
  constructor(
    $window,
    $q,
    $rootScope,
    $scope,
    $mdDialog,
    $mdToast,
    $stateParams,
    storageService,
    auth0Service,
    paymentProfileService,
    applicationService,
    organizationService,
    permissionService,
    featureService,
    uiService,
    relationalService,
    Permission,
    SearchEntity
  ) {
    this.$window = $window;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$mdToast = $mdToast;
    this.$stateParams = $stateParams;
    this.auth0Service = auth0Service;
    this.paymentProfileService = paymentProfileService;
    this.applicationService = applicationService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.featureService = featureService;
    this.uiService = uiService;
    this.relationalService = relationalService;
    this.Permission = Permission;
    this.SearchEntity = SearchEntity;

    this.features = [];
    this.paymentProfiles = [];
    this.selected = [];
    this.selectedPaymentProfile = [];
    this.selectedFeature = [];
    this.storage = storageService.read();

    this.$scope.uiReady = false;

    this.run();
  }

  run() {
    this.$scope.uiReady = false;
    this.$scope.loading = false;
    this.$scope.organizationPermissionTypes = null;

    this.$scope.$parent.ready.then((resolve) => {
      const applicationWritePermissions = resolve.permission.entity.filter((permission) => {
        return permission.objectClass === this.applicationService.getObjectClassName() &&
               permission.has(this.applicationService.getWritePermission());
      });

      this.$scope.hasApplicationWrite = applicationWritePermissions.length > 0;
      this.$scope.currentUser = resolve.user;
      return this.loadUI(this.$stateParams.organizationId);
    }, () => {
      this.uiService.notify('Unable to find organization');
    }).finally(() => {
      this.$scope.uiReady = true;
    });

    [
      'ORGANIZATION.PERMISSION.WRITE',
      'SUBSCRIPTION.CREATED',
      'FEATURE.ORGANIZATION.WRITE',
      'PAYMENT.PROFILE.CREATED',
      'PAYMENT.PROFILE.DELETED'
    ].forEach((event) => {
      this.$scope.$on(event, (argument) => {
        this.loadUI(this.$stateParams.organizationId);
      });
    });
  }

  changeInclusion(id, inclusion) {
    if (inclusion === 0) {
      const object = this.$scope.userPermissionModel[id].permission;

      for (let key in object) {
        object[key] = true;
      }
    }
  }

  submit(organization, userPermissions) {
    const loading = this.uiService.load();

    const permissions = this.$window.Object.keys(userPermissions).map((user_id) => {
      const userPermission = userPermissions[user_id];

      const permission = new this.Permission();
      permission.user_id = user_id;
      permission.objectClass = this.organizationService.getObjectClassName();
      permission.objectId = this.$stateParams.organizationId;
      permission.include = userPermission.include;
      permission.permissions = this.$window.Object.keys(userPermission.permission).reduce(function(previous, current) {
        if (userPermission.permission[current] === true) {
          previous.push(current);
        }

        return previous;
      }, []);

      return permission;
    });

    return this.permissionService.write(this.storage.token, this.$stateParams.organizationId, permissions).then(() => {
      return this.organizationService.update(this.storage.token, organization).then((organization) => {
        loading.dialog.finally(() => {
          this.uiService.notify('Updated organization');
        });

        return this.loadUI(organization.id);
      }, () => {
        this.uiService.notify('Unable to update organization');
      });
    }).finally(() => {
        loading.close.resolve();
    });
  }

  getUserPermissionModel(users, permissions, userPermissions) {
    const userPermissionsMap = this.relationalService.groupBy(userPermissions, false, subject => subject.user_id);

    return this.$window.Object.keys(userPermissionsMap).reduce((previous, user_id) => {
      const permission = userPermissionsMap[user_id][0];
      let set;

      if (permission.include === 0) {
        set = null;
      } else {
        set = new this.$window.Set();

        permission.permissions.forEach(set.add, set);
      }

      const selectedPermissions = permissions.reduce(function(previous, current) {
        previous[current] = permission.include === 0 || set.has(current);
        return previous;
      }, {});

      previous[user_id] = {
        include: permission.include,
        permission: selectedPermissions
      };

      return previous;
    }, {});
  }

  loadUI(organizationId) {
    const date = new this.$window.Date();

    return this.organizationService.read(this.storage.token, organizationId).then((organization) => {
      this.$scope.organization = organization;

      const paymentProfileFutures = this.paymentProfileService.search(this.storage.token, {
        organizationId: organizationId
      });

      const featureFuture = this.featureService.search(this.storage.token, {
        organizationId: organizationId,
        type: this.featureService.getOrganizationEventFeature(),
        timeEndGreaterThan: date.getTime()
      });

      const permission = this.permissionService.search(this.storage.token, {
        objectId: organization.id,
        objectClass: this.organizationService.getObjectClassName()
      });

      return this.$q.all({
        types: this.permissionService.getTypes(this.storage.token),
        permissions: permission,
        feature: featureFuture,
        paymentProfile: paymentProfileFutures
      }).then((resolve) => {
        let userPromise;
        const permissions = resolve.permissions.entity;
        this.$scope.organizationPermissionTypes = resolve.types.Organization;
        this.paymentProfiles = resolve.paymentProfile.entity;
        this.features = resolve.feature.entity;

        if (permissions.length === 0) {
          userPromise = this.$q.resolve([]);
        } else {

          const query = permissions.map(function(permission) {
            return 'user_id: "' + permission.user_id + '"';
          }).join(' OR ');

          userPromise = this.auth0Service.searchUsers(this.storage.token, {
            search_engine: 'v2',
            q: query
          });
        }

        return userPromise.then((users) => {
          this.$scope.users = this.relationalService.oneToOneJoin(users, 'id', permissions, 'user_id').map(function(relation) {
            relation.entity.permission = relation.foreign;
            return relation.entity;
          });

          const userPermissionModel = this.getUserPermissionModel(users, this.$scope.organizationPermissionTypes, permissions);
          this.$scope.userPermissionModel = userPermissionModel;
        });
      });
    });
  }

  addUserPermission() {
    this.$mdDialog.show({
      controller: 'AddUserOrganizationPermissionController',
      templateUrl: '/src/organization/partial/addUserPermission.html',
      controllerAs: 'controller',
      clickOutsideToClose: true,
      locals: {
        organization: this.$scope.organization
      }
    });
  }

  createOrganizationFeature(organization) {
    this.$mdDialog.show({
      controller: 'CreateOrganizationFeatureController',
      templateUrl: '/src/organization/partial/createOrganizationFeature.html',
      controllerAs: 'controller',
      clickOutsideToClose: true,
      locals: {
        organization: organization
      }
    });
  }

  deleteOrganizationFeature($event, feature) {
    const confirm = this.$mdDialog.confirm()
          .title('Are you sure you want to delete this feature?')
          .ariaLabel('Delete Feature')
          .targetEvent($event)
          .ok('DELETE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      const loader = this.uiService.load();

      this.featureService.delete(this.storage.token, feature.id).then(() => {
        loader.dialog.finally(() => {
          this.$rootScope.$broadcast('FEATURE.ORGANIZATION.WRITE');
        });
      }).finally(() => {
        loader.close.resolve();
      });
    });
  }

  createPaymentProfile(organization) {
    this.$mdDialog.show({
      controller: 'CreatePaymentProfileController',
      templateUrl: '/src/payment/profile/partial/create.html',
      clickOutsideToClose: true,
      locals: {
        organization: organization
      }
    });
  }

  deletePaymentProfile($event, paymentProfile) {
    const confirm = this.$mdDialog.confirm()
          .title('Are you sure you want to delete this payment profile?')
          .ariaLabel('Delete Payment Profile')
          .targetEvent($event)
          .ok('DELETE')
          .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      const loader = this.uiService.load();

      this.paymentProfileService.delete(this.storage.token, paymentProfile.id).then((profile) => {
        loader.dialog.finally(() => {
          this.$rootScope.$broadcast('PAYMENT.PROFILE.DELETED', profile);
        });
      }, (response) => {
        const hasItems = this.$window.Array.isArray(response.data);
        const text = hasItems ? 'Unable to delete, Payment Profile is associated with an Event' : 'Unable to delete Payment Profile';

        loader.dialog.finally(() => {
          this.uiService.notify(text);
        });
      }).finally(() => {
        loader.close.resolve();
      });
    });
  }

  removeUserFromOrganization(user) {
    this.permissionService.delete(this.storage.token, {
      user_id: user.user_id,
      objectId: this.$stateParams.organizationId,
      objectClass: this.organizationService.getObjectClassName()
    }).then(() => {
      const removeIndex = this.$scope.users.indexOf(user);
      this.$scope.users.splice(removeIndex, 1);
    });
  }

  createEventSubscription() {
    this.$scope.$parent.ready.then((resolve) => {
      this.$mdDialog.show({
        controller: 'CreateSubscriptionController',
        templateUrl: '/src/organization/partial/createSubscription.html',
        controllerAs: 'controller',
        clickOutsideToClose: true,
        locals: {
          organization: this.$scope.organization,
          user: resolve.user
        }
      });
    });
  }
}

UpdateOrganizationController.$inject = [
  '$window',
  '$q',
  '$rootScope',
  '$scope',
  '$mdDialog',
  '$mdToast',
  '$stateParams',
  'StorageService',
  'Auth0Service',
  'PaymentProfileService',
  'ApplicationService',
  'OrganizationService',
  'PermissionService',
  'FeatureService',
  'UIService',
  'RelationalService',
  'Permission',
  'SearchEntity'
];