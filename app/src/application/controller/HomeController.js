export default class HomeController {
  constructor($scope, $state, eventService, accessService) {
    this.$scope = $scope;
    this.$state = $state;
    this.eventService = eventService;

    $scope.accessService = accessService;
    $scope.event = null;
  }

  selected() {
    this.$state.go('application.public.event', {id: this.$scope.event.id});
  }

  query(search) {
    return this.eventService.publicSearch({
      text: search
    }).then(result => result.entity);
  }
}

HomeController.$inject = ['$scope', '$state', 'EventService', 'AccessService'];