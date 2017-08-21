import angular from 'angular';
import lf from 'lovefield';

export default class ReadOrganizationController {
  constructor(
    $scope,
    $timeout,
    $state,
    $mdDialog,
    storageService,
    organizationService,
    uiService,
    Permission,
    db
  ) {
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.db = db;

    this.storage = storageService.read();

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
      const permissionTable = this.db.getSchema().table('Permission');

      return this.db.select()
        .from(organizationTable)
        .innerJoin(permissionTable, permissionTable.objectId.eq(organizationTable.id))
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
    }).then(() => {
    }, () => {
    }).then(() => {
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
      this.$scope.uiReady = false;

      this.organizationService.delete(this.storage.auth.idToken, organizationData.Organization.id).then(() => {
        this.uiService.notify('Organization deleted');
      }, () => {
        this.uiService.notify('Unable to delete organization');
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    });
  }

  createOrganization() {
    this.$mdDialog.show({
      controller: 'CreateOrganizationController',
      controllerAs: 'controller',
      templateUrl: '/src/organization/partial/create.html',
      clickOutsideToClose: true
    });
  }
}

ReadOrganizationController.$inject = [
  '$scope',
  '$timeout',
  '$state',
  '$mdDialog',
  'StorageService',
  'OrganizationService',
  'UIService',
  'Permission',
  'db'
];