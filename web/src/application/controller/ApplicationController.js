import verifiedPartial from '../../access/partial/verified.html';
import createOrganizationAndEventPartial from '../../event/partial/createOrganizationAndEvent.html';
import LocalisationService from '../../service/LocalisationService';

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
    uiService,
    connectionService,
    storageService,
    auth0Service,
    db,
    onAuthentication
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
    this.uiService = uiService;
    this.connectionService = connectionService;
    this.storageService = storageService;
    this.auth0Service = auth0Service;
    this.db = db;
    this.onAuthentication = onAuthentication;

    this.$scope.storage = storageService.read();
    this.$scope.selectedTab = 0;
    this.$scope.uiReady = false;
    this.$scope.invitations = [];

    const localisationService = new LocalisationService();
    this.$scope.translate = (term) => localisationService.translate(term);
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
      ready = new Date().getTime() < exp ? this.loadUserData() : Promise.reject();
    }

    this.$scope.ready = ready;

    ready.then(() => {
      const showEmailUnverified = storage.profile.user_id.startsWith('auth0') &&
        !storage.profile.email_verified &&
        storage.profile.logins_count > 1;

      if (showEmailUnverified) {
        this.$mdDialog.show({
          template: verifiedPartial,
          controller: 'EmailVerifiedController',
          controllerAs: 'controller',
          clickOutsideToClose: false
        });
      }

      return this.refreshPermissions();
    }).then(() => {
      this.$scope.uiReady = true;
    }, () => {
      if (this.$state.$current.name !== 'application.oauthRedirect') {
        this.storageService.reset();

        const isAuthenticatedPage = this.$state.$current.name.startsWith('application.internal');

        if (isAuthenticatedPage) {
          location.href = '/';
        }
      }

      this.$scope.storage = this.storageService.read();
      this.$scope.uiReady = true;
    });
  }

  refreshPermissions() {
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
        return rows;
      });

    return Promise.all([organizationInvitationFuture, permissionFuture]);
  }

  loadUserData() {
    const storage = this.storageService.read();
    this.connectionService.closeEventSources();
    this.connectionService.deleteEventSources();

    const profileFuture = this.auth0Service.getUser(storage.auth.accessToken, storage.auth.idTokenPayload.sub).then((profile) => {
      const storage = this.storageService.read();
      storage.profile = profile;
      this.storageService.write(storage);
    });

    const eventSource = this.connectionService.getEventSource(storage.auth.accessToken, storage.auth.idTokenPayload.sub);
    this.downstreamService.bootstrapEventSource(eventSource);

    const userCacheStart = new Date().getTime();

    const cacheFuture = this.downstreamService.cacheUserData(storage.auth).then(() => {
      const userCacheEnd = new Date().getTime();

      this.uiService.logInteraction(storage.auth.accessToken, {
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
      template: createOrganizationAndEventPartial,
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
  'UIService',
  'ConnectionService',
  'StorageService',
  'Auth0Service',
  'db',
  'onAuthentication'
];