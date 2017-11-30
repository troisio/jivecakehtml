import anguar from 'angular';
import createConsentAssetHtml from '../partial/createConsentAsset.html';
import createInvitationPartial from '../partial/createOrganizationInvitationController.html';
import consentPartial from '../partial/consent.html';
import createPaymentProfilePartial from '../../payment/profile/partial/create.html';

export default class UpdateOrganizationController {
  constructor(
    $q,
    $timeout,
    $scope,
    $mdDialog,
    $stateParams,
    storageService,
    assetService,
    paymentProfileService,
    applicationService,
    organizationService,
    organizationInvitationService,
    permissionService,
    uiService,
    relationalService,
    stripeService,
    Permission,
    db
  ) {
    this.$q = $q;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$stateParams = $stateParams;
    this.storageService = storageService;
    this.assetService = assetService;
    this.storageService = storageService;
    this.paymentProfileService = paymentProfileService;
    this.applicationService = applicationService;
    this.organizationService = organizationService;
    this.organizationInvitationService = organizationInvitationService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.relationalService = relationalService;
    this.stripeService = stripeService;
    this.Permission = Permission;
    this.db = db;

    this.$scope.selectedSubscriptions = [];
    this.$scope.selectConsentAcknowledgement = [];
    this.$scope.subscriptions = [];
    this.$scope.assets = [];
    this.paymentProfiles = [];
    this.selected = [];
    this.selectedPaymentProfile = [];
    this.storage = storageService.read();
    this.$scope.auth = this.storage.auth;
    this.$scope.organizationPermissionTypes = [];
    this.$scope.loading = false;

    [
      'ORGANIZATION.PERMISSION.WRITE',
      'organization.delete',
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
    }, (response) => {
      const text = response.status === 409 ? 'Organization email taken' : 'Unable to update organization';
      this.uiService.notify(text);
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
    return this.organizationService.read(organizationId).then((organization) => {
      this.$scope.organization = organization;

      const paymentProfileFutures = this.paymentProfileService.search(this.storage.auth.idToken, {
        organizationId: organizationId
      });

      const subscriptionFuture = this.stripeService.getOrganizationTrialingOrActiveSubscriptions(
        this.storage.auth.idToken,
        organizationId
      );

      const permission = this.permissionService.search(this.storage.auth.idToken, {
        objectId: organization.id,
        objectClass: 'Organization'
      });

      const assetFuture = this.assetService.search(this.storage.auth.idToken, {
        entityId: organization.id,
        entityType: this.assetService.ORGANIZATION_TYPE,
        order: '-timeCreated'
      });

      const organizationInvitationFuture = this.organizationInvitationService.getOrganizationInvitations(
        this.storage.auth.idToken,
        organization.id
      );

      return this.$q.all({
        asset: assetFuture,
        permissions: permission,
        subscription: subscriptionFuture,
        paymentProfile: paymentProfileFutures,
        organizationInvitation: organizationInvitationFuture
      }).then((resolve) => {
        const permissions = resolve.permissions.entity;
        const permissionTypes = this.permissionService.getTypes();
        const storage = this.storageService.read();

        this.$scope.organizationPermissionTypes = permissionTypes.find(type => type.class === 'Organization').permissions;
        this.$scope.assets = resolve.asset.entity;
        this.$scope.paymentProfiles = resolve.paymentProfile.entity;
        this.$scope.subscriptions = resolve.subscription;
        this.$scope.invitations = resolve.organizationInvitation;

        const userPromise = permissions.length === 0 ? Promise.resolve([]) : this.organizationService.getUsers(storage.auth.idToken, organization.id);

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

  addConsentAcknowledgement(organization) {
    this.$mdDialog.show({
      controller: 'CreateConsentAssetController',
      controllerAs: 'controller',
      template: createConsentAssetHtml,
      clickOutsideToClose: true,
      locals: {
        organization: organization,
        onAssetCreate: (asset) => {
          this.$scope.assets.unshift(asset);
          this.$timeout();
        }
      }
    });
  }

  deleteConsentAsset(asset) {
    const storage = this.storageService.read();

    this.assetService.delete(storage.auth.idToken, asset.id).then(() => {
      this.$scope.assets = this.$scope.assets.filter(subject => subject.id !== asset.id);
      this.uiService.notify('Document deleted');
    }, (response) => {
      if (typeof response.data == 'object' && response.data.error === 'entityAssetConsentId') {
        this.uiService.notify('Can not delete. Asset is being used by an event');
      } else {
        this.uiService.notify('Unable to delete document');
      }
    });
  }

  addUserPermission() {
    this.$mdDialog.show({
      controller: 'CreateOrganizationInvitationController',
      template: createInvitationPartial,
      controllerAs: 'controller',
      clickOutsideToClose: true,
      locals: {
        organization: this.$scope.organization
      }
    });
  }

  deleteInvitation(invitation) {
    const storage = this.storageService.read();
    this.organizationInvitationService.delete(storage.auth.idToken, invitation.id).then(response => {
      if (response.status === 200 || response.status === 404) {
        this.$scope.invitations = this.$scope.invitations.filter(subject => subject !== invitation);
        this.$timeout();
      } else {
        this.uiService.notify('Unable to decline invitation');
      }
    }, () => {
      this.uiService.notify('Unable to decline invitation');
    });
  }

  subscribe(organization) {
    const storage = this.storageService.read();
    this.stripeService.getMonthlySubscriptionId(
      storage.auth.idToken,
      storage.profile,
      organization.id
    ).then((subscriptionId) => {
      const description = subscriptionId === this.stripeService.MONTHLY_TRIAL_ID ?
        '$10 Monthly Subscription (Trial)' : '$10 Monthly Subscription';

      this.stripeService.showStripeMonthlySubscription({
        description: description
      }).then((token) => {
        const storage = this.storageService.read();
        this.stripeService.subscribe(
          storage.auth.idToken,
          organization.id,
          subscriptionId,
          {
            email: token.email,
            source: token.id
          }
        ).then(() => {
          this.stripeService.getOrganizationTrialingOrActiveSubscriptions(
            this.storage.auth.idToken,
            organization.id
          ).then((subscriptions) => {
            this.$scope.subscriptions = subscriptions;
            this.uiService.notify('Sucessfully added subscription');
            this.$timeout();
          });
        }, () => {
          this.uiService.notify('Unable to subcribe');
        });
      });
    });
  }

  unsubscribe(subscription) {
    const storage = this.storageService.read();

    this.uiService.notify('Unsubscribing...');

    this.stripeService.cancelSubscription(storage.auth.idToken, subscription.id).then(() => {
      return this.stripeService.getOrganizationTrialingOrActiveSubscriptions(
        this.storage.auth.idToken,
        this.$stateParams.organizationId
      ).then((subscriptions) => {
        this.$scope.subscriptions = subscriptions;
        this.$timeout();
      });
    }, () => {
      this.uiService.notify('Unable to cancel subscription');
    });
  }

  createPaymentProfile(organization) {
    this.$mdDialog.show({
      controller: 'CreatePaymentProfileController',
      template: createPaymentProfilePartial,
      clickOutsideToClose: true,
      controllerAs: 'controller',
      locals: {
        organization: organization,
        onPaymentProfileCreate: (profile) => {
          this.$scope.paymentProfiles.push(profile);
          this.$timeout();
        }
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

  showAsset($event, asset) {
    this.$mdDialog.show({
      targetEvent: $event,
      controller: ['$scope', function($scope) {
        $scope.text = atob(asset.data);
      }],
      template: consentPartial,
      clickOutsideToClose: true
    });
  }
}

UpdateOrganizationController.$inject = [
  '$q',
  '$timeout',
  '$scope',
  '$mdDialog',
  '$stateParams',
  'StorageService',
  'AssetService',
  'PaymentProfileService',
  'ApplicationService',
  'OrganizationService',
  'OrganizationInvitationService',
  'PermissionService',
  'UIService',
  'RelationalService',
  'StripeService',
  'Permission',
  'db'
];