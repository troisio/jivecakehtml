export default class HomeController {
  constructor($scope, $state, eventService) {
    this.$scope = $scope;
    this.$state = $state;
    this.eventService = eventService;

    this.$scope.event = null;
    this.eventService = eventService;
  }

  selected() {
    this.$state.go('application.public.event.item', {id: this.$scope.event.id});
  }

  query(search) {
    return this.eventService.publicSearch({
      text: search
    }).then(result => result.entity);
  }
}

HomeController.$inject = ['$scope', '$state', 'EventService'];