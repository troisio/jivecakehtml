export default class PublicController {
  constructor($scope) {
    $scope.ready = $scope.$parent.ready;
  }
}

PublicController.$inject = ['$scope'];