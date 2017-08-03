import anguar from 'angular';

export default class UpdateOrganizationController {
  constructor(
    $q,
    $timeout,
    $window,
    $scope,
    $mdDialog,
    $stateParams,
    storageService,
    auth0Service,
    paymentProfileService,
    applicationService,
    organizationService,
    permissionService,
    uiService,
    relationalService,
    stripeService,
    Permission,
    db
  ) {
    this.$q = $q;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$stateParams = $stateParams;
    this.storageService = storageService;
    this.auth0Service = auth0Service;
    this.paymentProfileService = paymentProfileService;
    this.applicationService = applicationService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.relationalService = relationalService;
    this.stripeService = stripeService;
    this.Permission = Permission;
    this.db = db;

    this.$scope.selectedSubscriptions = [];
    this.$scope.subscriptions = [];
    this.paymentProfiles = [];
    this.selected = [];
    this.selectedPaymentProfile = [];
    this.storage = storageService.read();
    this.$scope.auth = this.storage.auth;
    this.$scope.organizationPermissionTypes = [];
    this.$scope.loading = false;

    [
      'ORGANIZATION.PERMISSION.WRITE',
      'SUBSCRIPTION.CREATED',
      'paymentprofile.delete',
      'paymentprofile.create'
    ].forEach((event) => {
      this.$scope.$on(event, () => {
        this.loadUI(this.$stateParams.organizationId);
      });
    });

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then(() => {
      return this.loadUI(this.$stateParams.organizationId).then(() => {
        }, () => {
          this.uiService.notify('Unable to find organization');
        }).then(() => {
          this.$scope.uiReady = true;
          this.$timeout();
        });
    });
  }

  submit(organization) {
    this.$scope.loading = true;

    return this.organizationService.update(this.storage.auth.idToken, organization).then(() => {
      this.uiService.notify('Updated organization');
    }, () => {
      this.uiService.notify('Unable to update organization');
    }).finally(() => {
      this.$scope.loading = false;
      anguar.element(document.querySelector('md-content'))[0].scrollTop = 0;
    });
  }

  getUserPermissionModel(users, permissions, userPermissions) {
    const userPermissionsMap = this.relationalService.groupBy(userPermissions, false, subject => subject.user_id);

    const result = Object.keys(userPermissionsMap).reduce((previous, user_id) => {
      const permission = userPermissionsMap[user_id][0];
      let set;

      if (permission.include === 0) {
        set = null;
      } else {
        set = new Set();

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

    return result;
  }

  loadUI(organizationId) {
    return this.organizationService.read(this.storage.auth.idToken, organizationId).then((organization) => {
      this.$scope.organization = organization;

      const paymentProfileFutures = this.paymentProfileService.search(this.storage.auth.idToken, {
        organizationId: organizationId
      });

      const subscriptionFuture = this.stripeService.getSubscriptions(this.storage.auth.idToken, organizationId);

      const permission = this.permissionService.search(this.storage.auth.idToken, {
        objectId: organization.id,
        objectClass: 'Organization'
      });

      return this.$q.all({
        permissions: permission,
        subscription: subscriptionFuture,
        paymentProfile: paymentProfileFutures
      }).then((resolve) => {
        let userPromise;
        const permissions = resolve.permissions.entity;
        const permissionTypes = this.permissionService.getTypes();

        this.$scope.organizationPermissionTypes = permissionTypes.find(type => type.class === 'Organization').permissions;

        this.paymentProfiles = resolve.paymentProfile.entity;
        this.$scope.subscriptions = resolve.subscription;

        if (permissions.length === 0) {
          userPromise = this.$q.resolve([]);
        } else {
          const query = permissions.map(permission => 'user_id: "' + permission.user_id + '"').join(' OR ');

          userPromise = this.auth0Service.searchUsers(this.storage.auth.idToken, {
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

  subscribe(organization) {
    this.stripeService.showStripeMonthlySubscription().then((token) => {
      const storage = this.storageService.read();

      this.stripeService.subscribe(storage.auth.idToken, organization.id, {
        email: token.email,
        source: token.id
      }).then(() => {
        return this.stripeService.getSubscriptions(storage.auth.idToken, organization.id).then((subscriptions) => {
          this.$scope.subscriptions = subscriptions;
        }).finally(() => {
            this.uiService.notify('Sucessfully added subscription');
        });
      }, () => {
        this.uiService.notify('Unable to subcribe');
      });
    });
  }

  unsubscribe(subscription) {
    const storage = this.storageService.read();

    this.stripeService.cancelSubscription(storage.auth.idToken, subscription.id).then(() => {
      return this.stripeService.getSubscriptions(storage.auth.idToken, this.$stateParams.organizationId).then((subscriptions) => {
        this.$scope.subscriptions = subscriptions;
      }).finally(() => {
        this.uiService.notify('Subscription cancelled');
      });
    }, () => {
      this.uiService.notify('Unable to cancel subscription');
    });
  }

  createPaymentProfile(organization) {
    this.$mdDialog.show({
      controller: 'CreatePaymentProfileController',
      templateUrl: '/src/payment/profile/partial/create.html',
      clickOutsideToClose: true,
      controllerAs: 'controller',
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
      this.paymentProfileService.delete(this.storage.auth.idToken, paymentProfile.id).then(() => {
      }, (response) => {
        let text;

        if (typeof response.data === 'object' && response.data.error === 'event') {
          text = 'Unable to delete, Payment Profile is associated with an Event';
        } else {
          text = 'Unable to delete Payment Profile';
        }

        this.uiService.notify(text);
      });
    });
  }

  removeUserFromOrganization(user) {
    this.permissionService.delete(this.storage.auth.idToken, {
      user_id: user.user_id,
      objectId: this.$stateParams.organizationId,
      objectClass: 'Organization'
    }).then(() => {
      const removeIndex = this.$scope.users.indexOf(user);
      this.$scope.users.splice(removeIndex, 1);
    }, () => {
      this.uiService.notify('Unable to remove user from organization');
    });
  }
}

UpdateOrganizationController.$inject = [
  '$q',
  '$timeout',
  '$window',
  '$scope',
  '$mdDialog',
  '$stateParams',
  'StorageService',
  'Auth0Service',
  'PaymentProfileService',
  'ApplicationService',
  'OrganizationService',
  'PermissionService',
  'UIService',
  'RelationalService',
  'StripeService',
  'Permission',
  'db'
];