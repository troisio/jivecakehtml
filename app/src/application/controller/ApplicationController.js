export default class ApplicationController {
  constructor(
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
    Permission,
    SearchEntity
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
    this.SearchEntity = SearchEntity;
    this.Permission = Permission;
    this.db = db;

    this.storage = storageService.read();

    this.$scope.storage = this.storage;
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;

    this.$scope.permissionService = permissionService;

    const hasPermission = new Permission().has;
    this.$scope.hasPermission = (permission, target) => hasPermission.call(permission, target);

    this.run();
  }

  run() {
    const ready = this.storage.auth === null ? this.$q.reject() : this.getApplicationFutures();
    this.$scope.ready = ready;

    ready.then(resolve => {
      const hasPermission = new this.Permission().has;
      const permissionTable = this.db.getSchema().table('Permission');

      this.db.select()
        .from(permissionTable)
        .exec()
        .then(rows => {
          this.$scope.organizationPermissions = rows.filter(permission => permission.objectClass === 'Organization');
          this.$scope.applicationReadPermissions = rows.filter(permission =>
            permission.objectClass === 'Application' && hasPermission.call(permission, this.permissionService.READ)
          );
        });

      const showEmailUnverified = this.storage.profile.user_id.startsWith('auth0') &&
        !this.storage.profile.email_verified &&
        this.storage.profile.logins_count > 1;

      if (showEmailUnverified) {
        this.$mdDialog.show({
          templateUrl: '/src/access/partial/verified.html',
          controller: 'EmailVerifiedController',
          controllerAs: 'controller',
          clickOutsideToClose: false
        });
      }
    }, () => {
      this.storageService.reset();

      if (!this.$state.$current.name.startsWith('application.public')) {
        this.$state.go('application.public.home');
      }
    }).finally(() => {
      this.$scope.uiReady = true;
    });

    this.$scope.toggleSidenav = (id) => {
      this.$mdSidenav(id).toggle();
    };

    this.$scope.closeSideNav = (id) => {
      const component = this.$mdSidenav(id);

      if (component.isOpen() && !component.isLockedOpen()) {
        component.close();
      }
    };
  }

  getApplicationFutures() {
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    const eventSource = this.connectionService.getEventSource(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub);
    this.downstreamService.bootstrapEventSource(eventSource);

    return this.downstreamService.cacheUserData(this.storage.auth);
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
  'Permission',
  'SearchEntity'
];