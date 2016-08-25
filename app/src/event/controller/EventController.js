export default class EventController {
  constructor($scope) {
    $scope.$parent.showTabs = true;
    $scope.ready = $scope.$parent.ready;
    $scope.$parent.selectedTab = 1;
  }
}

EventController.$inject = ['$scope'];