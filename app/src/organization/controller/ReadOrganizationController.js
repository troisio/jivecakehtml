export default class ReadOrganizationController {
  constructor(
    $window,
    $q,
    $scope,
    $mdToast,
    $mdDialog,
    $state,
    permissionService,
    storageService,
    organizationService,
    applicationService,
    relationalService,
    uiService,
    Paging
  ) {
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.$mdToast = $mdToast;
    this.$mdDialog = $mdDialog;
    this.$state = $state;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.applicationService = applicationService;
    this.relationalService = relationalService;
    this.uiService = uiService;

    this.storage = storageService.read();

    this.$scope.selected = [];

    this.pagingService = new Paging((data) => {
      return this.$q.resolve(0);
    }, (limit, offset) => {
      const query = angular.copy($state.params);

      delete query.page;
      delete query.pageSize;

      query.limit = limit;
      query.offset = offset;

      return this.organizationService.getOrganizationArrayWithPermissions(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub).then((data) => {
        if (typeof query.id !== 'undefined') {
          const ids = new this.$window.Set();
          const idArray = this.$window.Array.isArray(query.id) ? query.id : [query.id];
          idArray.forEach(ids.add, ids);

          data = data.filter(data => ids.has(data.organization.id));
        }

        return data;
      });
    });

    this.$scope.$parent.$parent.selectedTab = 0;
    this.$scope.uiReady = false;

    this.run();
  }

  run() {
    const page = this.$window.parseInt(this.$state.params.page);
    const pageSize = this.$window.parseInt(this.$state.params.pageSize);

    this.$scope.$parent.ready.then(resolve => {
      return this.loadPage(page, pageSize);
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  loadPage(page, pageSize) {
    this.$scope.uiReady = false;

    return this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }).finally(() => {
      this.$scope.uiReady = true;
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

      this.organizationService.delete(this.storage.auth.idToken, organizationData.organization.id).then((organization) => {
        this.uiService.notify('Organization deleted');

        const removeIndex = this.$scope.paging.data.indexOf(organizationData);
        this.$scope.paging.data.splice(removeIndex, 1);
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
  '$window',
  '$q',
  '$scope',
  '$mdToast',
  '$mdDialog',
  '$state',
  'PermissionService',
  'StorageService',
  'OrganizationService',
  'ApplicationService',
  'RelationalService',
  'UIService',
  'Paging'
];