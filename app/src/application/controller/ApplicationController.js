export default class ApplicationController {
  constructor(
    angular,
    $window,
    $rootScope,
    $scope,
    $q,
    $mdDialog,
    $state,
    $stateParams,
    $mdSidenav,
    accessService,
    applicationService,
    organizationService,
    permissionService,
    auth0Service,
    uiService,
    connectionService,
    storageService,
    settings
  ) {
    this.angular = angular;
    this.$window = $window;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$q = $q;
    this.$mdDialog = $mdDialog;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$mdSidenav = $mdSidenav;
    this.accessService = accessService;
    this.applicationService = applicationService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.auth0Service = auth0Service;
    this.uiService = uiService;
    this.connectionService = connectionService;
    this.storageService = storageService;
    this.settings = settings;

    this.storage = storageService.read();
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;

    this.run();
  }

  run() {
    let ready;

    if (this.storage.auth === null) {
      ready = this.$q.reject();
    } else {
      ready = this.getApplicationFutures(this.storage.auth.idToken);
    }

    this.$scope.ready = ready;

    ready.then(resolve => {
      this.loadScopePermissions(this.$scope, resolve.permission.entity);

      return this.auth0Service.getUser(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub).then((profile) => {
        this.$scope.user = profile;

        const showEmailUnverified = profile.user_id.startsWith('auth0') &&
          !profile.email_verified &&
          profile.logins_count > 1;

        if (showEmailUnverified) {
          this.$mdDialog.show({
            templateUrl: '/src/access/partial/verified.html',
            controller: 'EmailVerifiedController',
            controllerAs: 'controller',
            clickOutsideToClose: false
          });
        }
      });
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

    const connectionFuture = this.connectionService.getEventSource(this.storage.auth.idToken, this.storage.auth.idTokenPayload.sub).then(source => {
      source.addEventListener('transaction.created', (response) => {
        const transaction = this.angular.fromJson(response.data);
        this.$rootScope.$broadcast('downstream.transaction.created', transaction);
      });

      source.addEventListener('agent.logout', () => {
        this.accessService.logout();
      });

      return source;
    });

    const permissonFuture = this.permissionService.search(this.storage.auth.idToken, {
      user_id: this.storage.auth.idTokenPayload.sub
    });

    return this.$q.all({
      permission: permissonFuture,
      connection: connectionFuture
    });
  }

  loadScopePermissions($scope, permissions) {
    const organizationPermissions = permissions.filter((permission) => {
      return permission.objectClass === this.organizationService.getObjectClassName();
    });

    const applicationReadPermissions = permissions.filter((permission) => {
      return permission.objectClass === this.applicationService.getObjectClassName() &&
             permission.has(this.applicationService.getReadPermission());
    });

    $scope.hasOrganizations = organizationPermissions.length > 0;
    $scope.hasApplicationRead = applicationReadPermissions.length > 0;
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
  'angular',
  '$window',
  '$rootScope',
  '$scope',
  '$q',
  '$mdDialog',
  '$state',
  '$stateParams',
  '$mdSidenav',
  'AccessService',
  'ApplicationService',
  'OrganizationService',
  'PermissionService',
  'Auth0Service',
  'UIService',
  'ConnectionService',
  'StorageService',
  'settings'
];