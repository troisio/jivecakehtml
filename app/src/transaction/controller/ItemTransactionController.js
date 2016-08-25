export default class ItemTransactionController {
  constructor($scope) {
    $scope.$parent.showTabs = true;
    $scope.ready = $scope.$parent.ready;
    $scope.$parent.selectedTab = 3;
  }
}

ItemTransactionController.$inject = ['$scope'];