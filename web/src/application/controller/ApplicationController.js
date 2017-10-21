export default class ApplicationController {
  constructor(
    $scope,
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
    lock,
    Permission
  ) {
    this.$scope = $scope;
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
    this.lock = lock;

    this.$scope.storage = storageService.read();
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;
    this.$scope.invitations = [];

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
      ready = Promise.reject();
    } else {
      const exp = storage.auth.idTokenPayload.exp * 1000;

      if (new Date().getTime() < exp) {
        ready = this.loadUserData();
      } else {
        ready = Promise.reject();
      }
    }

    this.$scope.ready = ready;

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
      this.$scope.uiReady = true;

      const isAuthenticatedPage = this.$state.$current.name.startsWith('application.internal');

      if (isAuthenticatedPage) {
        location.href = '/';
      }
    });
  }

  refreshPermissions() {
    const hasPermission = new this.Permission().has;
    const permissionTable = this.db.getSchema().table('Permission');

    const organizationInvitationTable = this.db.getSchema().table('OrganizationInvitation');
    const sevenDaysBefore = new Date();
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    const organizationInvitationFuture = this.db.select()
      .from(organizationInvitationTable)
      .where(
        organizationInvitationTable.timeAccepted.eq(null),
        organizationInvitationTable.timeCreated.gt(sevenDaysBefore.getTime())
      ).exec()
      .then(rows => {
        const storage = this.storageService.read();
        this.$scope.invitations = rows.filter(row => row.userIds.includes(storage.auth.idTokenPayload.sub));
      });

    const permissionFuture = this.db.select()
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

    return Promise.all([organizationInvitationFuture, permissionFuture]);
  }

  loadUserData() {
    const storage = this.storageService.read();
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    const profileFuture = new Promise((resolve) => {
      this.lock.getUserInfo(storage.auth.accessToken, (error, profile) => {
        if (!error) {
          const storage = this.storageService.read();
          storage.profile = profile;
          this.storageService.write(storage);
        }

        resolve();
      });
    });

    const eventSource = this.connectionService.getEventSource(storage.auth.idToken, storage.auth.idTokenPayload.sub);
    this.downstreamService.bootstrapEventSource(eventSource);

    const userCacheStart = new Date().getTime();

    const cacheFuture = this.downstreamService.cacheUserData(storage.auth).then(() => {
      const userCacheEnd = new Date().getTime();

      this.uiService.logInteraction(storage.auth.idToken, {
        event: 'cacheUserData',
        parameters: {
          duration: userCacheEnd - userCacheStart
        }
      });
    });

    return Promise.all([cacheFuture, profileFuture]);
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
  'lock',
  'Permission'
];