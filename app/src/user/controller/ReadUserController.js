export default class ReadUserController {
  constructor(
    angular,
    $window,
    $q,
    $scope,
    $stateParams,
    $mdDialog,
    Paging,
    auth0Service,
    storageService,
    permissionService,
    applicationService,
    notificationService,
    uiService,
    toolsService
  ) {
    this.angular = angular;
    this.$window = $window;
    this.$q = $q;
    this.$scope = $scope;
    this.$stateParams = $stateParams;
    this.$mdDialog = $mdDialog;
    this.Paging = Paging;
    this.auth0Service = auth0Service;
    this.permissionService = permissionService;
    this.applicationService = applicationService;
    this.notificationService = notificationService;
    this.uiService = uiService;
    this.toolsService = toolsService;

    this.storage = storageService.read();
    this.pagingService = new this.Paging((data) => {
      return this.$q.resolve(data.count);
    }, (limit, offset) => {
      const query = this.toolsService.stateParamsToQuery($stateParams);

      return this.auth0Service.searchUsers(this.storage.token, {
        page: query.page,
        per_page: query.pageSize,
        search_engine: 'v2'
      });
    });

    this.run();
  }

  run() {
    const application = this.applicationService.getApplication();
    this.$scope.$parent.selectedTab = 4;
    this.$scope.hasApplicationWrite = false;
    this.$scope.hasApplicationRead = false;

    this.$scope.$parent.ready.then((resolve) => {
      this.$scope.currentUser = resolve.user;

      const permissions = resolve.permission.entity;
      const applicationPermissions = permissions.filter((permission) => {
        return permission.objectId === application.id &&
               permission.objectClass === this.applicationService.getObjectClassName();
      });

      if (applicationPermissions.length > 0) {
        const permission = applicationPermissions[0];

        this.$scope.hasApplicationRead = permission.has(this.applicationService.getReadPermission());
        this.$scope.hasApplicationWrite = permission.has(this.applicationService.getWritePermission());
      }

      this.loadPage(
        this.$window.parseInt(this.$stateParams.page),
        this.$window.parseInt(this.$stateParams.pageSize)
      );
    });

    this.$scope.logout = (user) => {
      this.notificationService.send(this.storage.token, {
        name: 'agent.logout',
        data: {}
      }, {user_id: user.user_id}).then(() => {
        let message;
        const hasGivenName = 'given_name' in user &&  typeof user.given_name === 'string';

        if (hasGivenName) {
          const lastLetter = user.given_name === null || user.given_name.length === 0 ? '' : user.given_name[user.given_name.length - 1];
          let posession = "'";

          if (lastLetter !== 's') {
            posession += 's';
          }

          message = 'Logout has been sent to ' + user.given_name + posession + ' agents';
        } else {
          message = 'Logout has been sent';
        }

        this.uiService.notify(message);
      }, () => {
        this.uiService.notify('Unable to send logout event to user');
      });
    };

    this.$scope.$on('USER.UPDATED', () => {
      this.loadPage(
        this.$window.parseInt(this.$stateParams.page),
        this.$window.parseInt(this.$stateParams.pageSize)
      );
    });
  }

  loadPage(page, pageSize) {
    const loading = this.uiService.load();

    return this.pagingService.getPaging(page, pageSize).then((paging) => {
      this.$scope.paging = paging;
    }).finally(() => {
      loading.close.resolve();
    });
  }
}

ReadUserController.$inject = [
  'angular',
  '$window',
  '$q',
  '$scope',
  '$stateParams',
  '$mdDialog',
  'Paging',
  'Auth0Service',
  'StorageService',
  'PermissionService',
  'ApplicationService',
  'NotificationService',
  'UIService',
  'ToolsService'
];