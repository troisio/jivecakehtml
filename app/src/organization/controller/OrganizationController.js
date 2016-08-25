export default class OrganizationController {
  constructor($scope) {
    $scope.$parent.showTabs = true;
    $scope.$parent.selectedTab = 0;
  }
}

OrganizationController.$inject = ['$scope'];