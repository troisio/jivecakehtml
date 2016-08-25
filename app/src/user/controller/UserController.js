export default class UserController {
  constructor($scope) {
    this.$scope = $scope;
  }

  run() {
    this.$scope.ready = this.$scope.$parent.ready;
    this.$scope.$parent.selectedTab = 4;
  }
}

UserController.$inject = ['$scope'];