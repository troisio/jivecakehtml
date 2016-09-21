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
    eventService,
    itemService,
    organizationService,
    permissionService,
    auth0Service,
    uiService,
    connectionService,
    storageService,
    settings,
    auth
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
    this.eventService = eventService;
    this.itemService = itemService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.auth0Service = auth0Service;
    this.uiService = uiService;
    this.connectionService = connectionService;
    this.storageService = storageService;
    this.settings = settings;
    this.auth = auth;
    this.$scope.auth = auth;

    this.storage = storageService.read();
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;

    this.run();
  }

  run() {
    let ready;

    if (this.storage.token === null) {
      ready = this.$q.reject();
    } else {
      ready = this.getApplicationFutures(this.storage.token);
    }

    this.$scope.ready = ready;

    ready.then(resolve => {
      this.$scope.user = resolve.user;
      this.loadScopePermissions(this.$scope, resolve.permission.entity);

      this.auth0Service.getUser(this.storage.token, this.storage.profile.user_id).then((profile) => {
        if (!profile.email_verified && profile.user_id.startsWith('auth0')) {
          this.$mdDialog.show({
            templateUrl: '/src/access/partial/verified.html',
            controller: 'EmailVerifiedController',
            controllerAs: 'controller',
            clickOutsideToClose: false,
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
    const user = this.storage.profile;

    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    const connectionFuture = this.connectionService.getEventSource(this.storage.token, user.user_id).then(source => {
      source.addEventListener('item.transaction.created', (response) => {
        const transaction = this.angular.fromJson(response.data);

        if (user.user_id === transaction.user_id) {
          this.uiService.notify('You have a new transaction');

          const storage = this.storageService.read();
          storage.cart.delete(transaction.itemId);
          this.storageService.write(storage);
        } else {
          this.itemService.read(this.storage.token, transaction.itemId).then((item) => {
            this.eventService.read(this.storage.token, item.eventId).then((event) => {
              const message = 'New item transaction for ' + event.name + ' / ' + item.name;
              this.uiService.notify(message);
            });
          });
        }

        this.$rootScope.$broadcast('SSE.TRANSACTION.CREATED', transaction);
      });

      source.addEventListener('agent.logout', () => {
        this.accessService.logout();
      });

      return source;
    });

    const permissonFuture = this.permissionService.search(this.storage.token, {
      user_id: user.user_id
    });

    return this.$q.all({
      user: user,
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
  'EventService',
  'ItemService',
  'OrganizationService',
  'PermissionService',
  'Auth0Service',
  'UIService',
  'ConnectionService',
  'StorageService',
  'settings',
  'auth'
];