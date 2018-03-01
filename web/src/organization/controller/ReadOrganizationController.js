import angular from 'angular';
import lf from 'lovefield';
import organizationCreatePartial from '../partial/create.html';

export default class ReadOrganizationController {
  constructor(
    $scope,
    $timeout,
    $state,
    $mdDialog,
    storageService,
    downstreamService,
    organizationService,
    organizationInvitationService,
    uiService,
    Permission,
    db
  ) {
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.storageService = storageService;
    this.downstreamService = downstreamService;
    this.organizationService = organizationService;
    this.organizationInvitationService = organizationInvitationService;
    this.uiService = uiService;
    this.db = db;

    this.$scope.selected = [];
    this.$scope.$parent.$parent.selectedTab = 0;
    this.$scope.uiReady = false;

    ['organization.create', 'organization.update', 'organization.delete'].forEach((name) => {
      $scope.$on(name, () => {
        this.run();
      });
    });

    this.run();
  }

  run() {
    this.$scope.$parent.ready.then(() => {
      const organizationTable = this.db.getSchema().table('Organization');
      const organizationInvitation = this.db.getSchema().table('OrganizationInvitation');
      const permissionTable = this.db.getSchema().table('Permission');

      const sevenDaysAhead = new Date();
      sevenDaysAhead.setDate(sevenDaysAhead.getDate() - 7);

      const invitationFutures = this.db.select()
        .from(organizationInvitation)
        .where(
          organizationInvitation.timeAccepted.eq(null),
          organizationInvitation.timeCreated.gt(sevenDaysAhead.getTime())
        )
        .exec()
        .then(invitations => {
          const storage = this.storageService.read();
          const invitationFutures = invitations
            .filter(invitations => invitations.userIds.includes(storage.auth.idTokenPayload.sub))
            .map(invitation => {
              return this.organizationService.read(invitation.organizationId).then(organization => {
                return Object.assign({
                  organization: organization,
                }, invitation);
              });
            });
          return Promise.all(invitationFutures);
        })
        .then(invitations => {
          this.$scope.invitations = invitations;
        });

      const searchFuture = this.db.select()
        .from(organizationTable)
        .innerJoin(permissionTable, permissionTable.objectId.eq(organizationTable.id))
        .where(permissionTable.read.eq(true))
        .orderBy(organizationTable.lastActivity, lf.Order.DESC)
        .limit(100)
        .exec()
        .then(rows => {
          const data = angular.copy(rows);
          const organization = data.find(datum => datum.Organization.id === this.$state.params.highlight);
          const index = data.indexOf(organization);

          if (index > -1) {
            data.splice(index, 1);
            data.unshift(organization);
          }

          this.$scope.data = data;
        });

      return Promise.all([
        searchFuture,
        invitationFutures
      ]);
    }).then(() => {}, () => {}).then(() => {
      this.$scope.uiReady = true;
      this.$timeout();
    });
  }

  delete(organizationData, $event) {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure you want to delete this organization?')
      .ariaLabel('Delete Organization')
      .clickOutsideToClose(true)
      .targetEvent($event)
      .ok('DELETE')
      .cancel('Cancel');

    this.$mdDialog.show(confirm).then(() => {
      const storage = this.storageService.read();

      this.organizationService.delete(storage.auth.accessToken, organizationData.Organization.id).then(() => {
        this.uiService.notify('Organization deleted');
      }, () => {
        this.uiService.notify('Unable to delete organization');
      });
    });
  }

  createOrganization() {
    this.$mdDialog.show({
      controller: 'CreateOrganizationController',
      controllerAs: 'controller',
      template: organizationCreatePartial,
      clickOutsideToClose: true
    });
  }

  acceptInvitation(invitation) {
    const storage = this.storageService.read();
    this.organizationInvitationService.accept(storage.auth.accessToken, invitation.id).then(permission => {
      const treeFuture = this.downstreamService.writeOrganizationTreeToLocalDatabase(storage.auth.accessToken, [invitation.organizationId]);
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionFuture = this.db.insertOrReplace()
        .into(permissionTable)
        .values([permissionTable.createRow(permission)])
        .exec();

      this.$scope.invitations = this.$scope.invitations.filter(subject => subject !== invitation);

      Promise.all([
        permissionFuture,
        treeFuture
      ]).then(() => {
        this.run();
      });
    }, () => {
      this.uiService.notify('Unable to accept invitation');
    });
  }

  declineInvitation(invitation) {
    const storage = this.storageService.read();
    this.organizationInvitationService.delete(storage.auth.accessToken, invitation.id).then(response => {
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
}

ReadOrganizationController.$inject = [
  '$scope',
  '$timeout',
  '$state',
  '$mdDialog',
  'StorageService',
  'DownstreamService',
  'OrganizationService',
  'OrganizationInvitationService',
  'UIService',
  'Permission',
  'db'
];