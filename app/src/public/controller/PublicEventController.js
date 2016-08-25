export default class PublicEventController {
  constructor($scope, $mdDialog, $stateParams, eventService) {
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$stateParams = $stateParams;
    this.eventService = eventService;

    this.$scope.event = null;
    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.ready = this.eventService.publicSearch({
      id: this.$stateParams.id
    }).then((paging) => {
      if (paging.entity.length > 0) {
        this.$scope.event = paging.entity[0];
      }
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  showInformation(event) {
    this.$mdDialog.show({
      controller: ['$window', '$sanitize', '$scope', 'event', function($window, $sanitize, $scope, event) {
        $scope.event = event;
        $scope.time = new $window.Date();
        $scope.$sanitize = $sanitize;
      }],
      templateUrl: '/src/public/partial/viewEvent.html',
      clickOutsideToClose: true,
      locals: {
        event: event
      }
    });
  }
}

PublicEventController.$inject = ['$scope', '$mdDialog', '$stateParams', 'EventService'];