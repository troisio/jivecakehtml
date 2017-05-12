export default class CreateEventController {
  constructor(
    $rootScope,
    $scope,
    $mdDialog,
    $state,
    eventService,
    permissionService,
    storageService,
    organizationService,
    uiService,
    Event,
    Permission,
    db
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$state = $state;
    this.eventService = eventService;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.Event = Event;
    this.Permission = Permission;
    this.db = db;

    this.$scope.loading = false;
    this.storage = storageService.read();

    this.run();
  }

  run() {
    this.$scope.event = new this.Event();
    this.$scope.event.minimumTimeBetweenTransactionTransfer = -1;

    const organizationTable = this.db.getSchema().table('Organization');
    const permissionTable = this.db.getSchema().table('Permission');

    this.db.select()
      .from(organizationTable)
      .innerJoin(permissionTable, permissionTable.objectId.eq(organizationTable.id))
      .where(permissionTable.user_id.eq(this.storage.auth.idTokenPayload.sub))
      .orderBy(organizationTable.lastActivity, lf.Order.DESC)
      .exec()
      .then(rows => {
        const hasPermission = new this.Permission().has;
        const data = rows.filter(row => hasPermission.call(row.Permission, this.permissionService.WRITE));

        if (data.length > 0) {
          this.$scope.event.organizationId = data[0].Organization.id;
        }

        this.$scope.data = data;
      });
  }

  createEvent(event) {
    this.$scope.loading = true;

    return this.eventService.create(this.storage.auth.idToken, event.organizationId, event).then((event) => {
      this.uiService.notify('Event created');
      this.$mdDialog.hide();
      this.$state.go('application.internal.event.update', {eventId: event.id});
    }, (response) => {
      const message = response.status === 409 ? 'Sorry, that name has already been taken' : 'Unable to create event';
      this.uiService.notify(message);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateEventController.$inject = [
  '$rootScope',
  '$scope',
  '$mdDialog',
  '$state',
  'EventService',
  'PermissionService',
  'StorageService',
  'OrganizationService',
  'UIService',
  'Event',
  'Permission',
  'db'
];