export default class HomeController {
  constructor($scope, $state, eventService, accessService, storageService) {
    this.$scope = $scope;
    this.$state = $state;
    this.eventService = eventService;

    $scope.accessService = accessService;
    $scope.event = null;

    const storage = storageService.read();
    $scope.auth = storage.auth;
  }

  selected() {
    this.$state.go('application.public.event', {hash: this.$scope.event.hash});
  }

  query(search) {
    return this.eventService.publicSearch({
      text: search
    }).then(result => result.entity);
  }
}

HomeController.$inject = ['$scope', '$state', 'EventService', 'AccessService', 'StorageService'];