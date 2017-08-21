export default class TransactionController {
  constructor($scope) {
    $scope.$parent.showTabs = true;
    $scope.ready = $scope.$parent.ready;
    $scope.$parent.selectedTab = 3;
  }
}

TransactionController.$inject = ['$scope'];