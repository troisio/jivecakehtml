export default class ItemController {
  constructor($scope) {
    $scope.$parent.showTabs = true;
    $scope.$parent.selectedTab = 2;
    $scope.ready = $scope.$parent.ready;
  }
}

ItemController.$inject = ['$scope'];