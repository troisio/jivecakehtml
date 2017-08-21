export default class ApplicationController {
  constructor(
    $rootScope,
    $scope,
    $q,
    $mdDialog,
    $state,
    $mdSidenav,
    accessService,
    applicationService,
    organizationService,
    transactionService,
    eventService,
    itemService,
    downstreamService,
    permissionService,
    uiService,
    connectionService,
    storageService,
    db,
    Permission
  ) {
    this.$scope = $scope;
    this.$q = $q;
    this.$mdDialog = $mdDialog;
    this.$state = $state;
    this.$mdSidenav = $mdSidenav;
    this.accessService = accessService;
    this.applicationService = applicationService;
    this.organizationService = organizationService;
    this.transactionService = transactionService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.downstreamService = downstreamService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.connectionService = connectionService;
    this.storageService = storageService;
    this.Permission = Permission;
    this.db = db;

    this.$scope.storage = storageService.read();
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;

    this.$scope.permissionService = permissionService;

    const hasPermission = new Permission().has;
    this.$scope.hasPermission = (permission, target) => hasPermission.call(permission, target);

    this.$scope.toggleSidenav = (id) => {
      this.$mdSidenav(id).toggle();
    };

    this.$scope.closeSideNav = (id) => {
      const component = this.$mdSidenav(id);

      if (component.isOpen() && !component.isLockedOpen()) {
        component.close();
      }
    };

    this.$scope.$on('application.permission.refresh', () => {
      this.$scope.uiReady = false;

      this.refreshPermissions()
      .then(() => {}, () => {})
      .then(() => {
        this.$scope.uiReady = true;
      });
    });

    this.run();
  }

  run() {
    const storage = this.storageService.read();
    let ready;

    if (storage.auth === null) {
      ready = this.$q.reject();
    } else {
      const exp = storage.auth.idTokenPayload.exp * 1000;
      if (new Date().getTime() < exp) {
        ready = this.getApplicationFutures();
      } else {
        ready = this.$q.reject();
      }
    }

    ready.then(() => {
      const showEmailUnverified = storage.profile.user_id.startsWith('auth0') &&
        !storage.profile.email_verified &&
        storage.profile.logins_count > 1;

      if (showEmailUnverified) {
        this.$mdDialog.show({
          templateUrl: '/src/access/partial/verified.html',
          controller: 'EmailVerifiedController',
          controllerAs: 'controller',
          clickOutsideToClose: false
        });
      }

      return this.refreshPermissions();
    }).then(() => {
      this.$scope.uiReady = true;
    }, () => {
      this.storageService.reset();
      this.$scope.storage = this.storageService.read();

      if (!this.$state.$current.name.startsWith('application.public')) {
        this.$state.go('application.public.home');
      }

      this.$scope.uiReady = true;
    });

    this.$scope.ready = ready;
  }

  refreshPermissions() {
    const hasPermission = new this.Permission().has;
    const permissionTable = this.db.getSchema().table('Permission');

    return this.db.select()
      .from(permissionTable)
      .exec()
      .then(rows => {
        this.$scope.organizationPermissions = rows.filter(permission => permission.objectClass === 'Organization');
        this.$scope.applicationReadPermissions = rows.filter(permission =>
          permission.objectClass === 'Application' &&
          hasPermission.call(permission, this.permissionService.READ)
        );

        return rows;
      });
  }

  getApplicationFutures() {
    const storage = this.storageService.read();
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    const eventSource = this.connectionService.getEventSource(storage.auth.idToken, storage.auth.idTokenPayload.sub);
    this.downstreamService.bootstrapEventSource(eventSource);

    const userCacheStart = new Date().getTime();

    return this.downstreamService.cacheUserData(storage.auth).then(() => {
      const userCacheEnd = new Date().getTime();

      this.uiService.logInteraction(storage.auth.idToken, {
        event: 'cacheUserData',
        parameters: {
          duration: userCacheEnd - userCacheStart
        }
      });
    });
  }

  createEvent() {
    this.$mdDialog.show({
      controller: 'CreateOrganizationAndEventController',
      controllerAs: 'controller',
      templateUrl: '/src/event/partial/createOrganizationAndEvent.html',
      clickOutsideToClose: true
    });
  }

  oauthSignIn() {
    this.accessService.oauthSignIn();
  }

  logout() {
    this.accessService.logout();
  }
}

ApplicationController.$inject = [
  '$rootScope',
  '$scope',
  '$q',
  '$mdDialog',
  '$state',
  '$mdSidenav',
  'AccessService',
  'ApplicationService',
  'OrganizationService',
  'TransactionService',
  'EventService',
  'ItemService',
  'DownstreamService',
  'PermissionService',
  'UIService',
  'ConnectionService',
  'StorageService',
  'db',
  'Permission'
];