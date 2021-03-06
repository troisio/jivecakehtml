import lf from 'lovefield';

export default class CreateItemController {
  constructor(
    $scope,
    $state,
    $mdDialog,
    permissionService,
    eventService,
    itemService,
    storageService,
    uiService,
    db,
    Item,
    Permission
  ) {
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.permissionService = permissionService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.uiService = uiService;
    this.db = db;
    this.Item = Item;
    this.Permission = Permission;

    this.storage = storageService.read();
    this.$scope.loading = false;
    this.$scope.search = '';
    this.$scope.item = new Item();

    this.run();
  }

  run() {
    const eventTable = this.db.getSchema().table('Event');
    const permissionTable = this.db.getSchema().table('Permission');

    this.db.select()
      .from(eventTable)
      .innerJoin(permissionTable, permissionTable.objectId.eq(eventTable.organizationId))
      .where(
        permissionTable.write.eq(true),
        permissionTable.objectClass.eq('Organization')
      )
      .orderBy(eventTable.lastActivity, lf.Order.DESC)
      .exec()
      .then(rows => {
        this.$scope.item.eventId = rows[0].Event.id;
        this.$scope.data = rows;
      });
  }

  submit(item) {
    this.$scope.loading = true;

    item.amount = 0;
    item.status = this.itemService.getInactiveStatus();

    this.itemService.create(this.storage.auth.accessToken, item).then(() => {
      this.$mdDialog.cancel();
      this.uiService.notify('Item created');
    }, () => {
      this.uiService.notify('Unable to create item');
    }).finally(() => {
      this.$scope.loading = false;
    });
  }
}

CreateItemController.$inject = [
  '$scope',
  '$state',
  '$mdDialog',
  'PermissionService',
  'EventService',
  'ItemService',
  'StorageService',
  'UIService',
  'db',
  'Item',
  'Permission'
];