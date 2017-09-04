import lf from 'lovefield';

export default class CreateEventController {
  constructor(
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
    this.$scope.loading = true;

    const event = new this.Event();
    event.requireName = false;
    event.assignIntegerToRegistrant = false;
    event.requirePhoto = false;

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
          event.organizationId = data[0].Organization.id;
        }

        this.$scope.data = data;
        this.$scope.event = event;
        this.$scope.loading = false;
      });
  }

  createEvent(event) {
    this.$scope.loading = true;

    return this.eventService.create(this.storage.auth.idToken, event.organizationId, event).then((event) => {
      this.$mdDialog.hide().then(() => {
        this.$state.go('application.internal.event.read', {highlight: event.id});
        this.uiService.notify('Event created');
      });
    }, (response) => {
      const message = response.status === 409 ? 'Sorry, that name has already been taken' : 'Unable to create event';
      this.uiService.notify(message);
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateEventController.$inject = [
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