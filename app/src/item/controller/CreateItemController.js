export default class CreateItemController {
  constructor(
    $q,
    $rootScope,
    $scope,
    $state,
    $mdDialog,
    organizationService,
    eventService,
    itemService,
    storageService,
    uiService,
    Organization,
    Event,
    permissions
  ) {
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.organizationService = organizationService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.uiService = uiService;
    this.Organization = Organization;
    this.Event = Event;
    this.permissions = permissions;

    this.storage = storageService.read();
    this.$scope.loading = false;
    this.$scope.eventSearchText = '';

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    const organizationIds = this.permissions.filter(subject =>
        subject.objectClass === this.organizationService.getObjectClassName() &&
        subject.has(this.organizationService.getWritePermission())
    ).map(permission => permission.objectId);

    return this.eventService.search(this.storage.auth.idToken, {
      organizationId: organizationIds,
      order: '-timeUpdated'
    }).then((eventSearch) => {
      this.$scope.events = eventSearch.entity;
    }, () => {
      this.uiService.notify('Unable to load Events');
      this.$mdDialog.cancel();
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  submit(item, event) {
    /*
      Export this if statement logic to view, need to see if form is valid
    */
    if (event !== null) {
      this.$scope.loading = true;
      item.eventId = event.id;

      item.maximumPerUser = null;
      item.status = this.itemService.getActiveStatus();

      this.itemService.create(this.storage.auth.idToken, item).then(item => {
        this.$state.go('application.internal.item.update', {
          itemId: item.id
        });

        this.$mdDialog.cancel();
        this.uiService.notify('Item created');
        this.$rootScope.$broadcast('ITEM.CREATED', item);
      }, () => {
        this.uiService.notify('Unable to create item');
      }).finally(() => {
        this.$scope.loading = false;
      });
    }
  }
}

CreateItemController.$inject = [
  '$q',
  '$rootScope',
  '$scope',
  '$state',
  '$mdDialog',
  'OrganizationService',
  'EventService',
  'ItemService',
  'StorageService',
  'UIService',
  'Organization',
  'Event',
  'permissions'
];