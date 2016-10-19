export default class PublicEventController {
  constructor($scope, $mdDialog, $stateParams, eventService, organizationService) {
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;
    this.$stateParams = $stateParams;
    this.eventService = eventService;
    this.organizationService =  organizationService;

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

        return this.organizationService.publicSearch({
          id: this.$scope.event.organizationId
        }).then((paging) => {
          this.$scope.organization = paging.entity[0];
        });
      }
    }).finally(() => {
      this.$scope.uiReady = true;
    });
  }

  showInformation(event, organization) {
    this.$mdDialog.show({
      controller: ['$window', '$sanitize', '$scope', 'event', 'organization', function($window, $sanitize, $scope, event, organization) {
        $scope.event = event;
        $scope.organization = organization;
        $scope.time = new $window.Date();
        $scope.$sanitize = $sanitize;
      }],
      templateUrl: '/src/public/partial/viewEvent.html',
      clickOutsideToClose: true,
      locals: {
        event: event,
        organization: organization
      }
    });
  }
}

PublicEventController.$inject = ['$scope', '$mdDialog', '$stateParams', 'EventService', 'OrganizationService'];