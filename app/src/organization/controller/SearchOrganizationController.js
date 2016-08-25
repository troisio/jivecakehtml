export default class SearchOrganizationController {
  constructor(angular, $rootScope, $scope, $mdDialog) {
    this.angular = angular;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$mdDialog = $mdDialog;

    this.run();
  }

  run() {
    this.$scope.close = this.$mdDialog.hide;

    this.$scope.query = {
      name: null,
      email: null
    };

    this.$scope.submit = (query) => {
      const queryCopy = this.angular.copy(query);

      for (let key in queryCopy) {
        const value = queryCopy[key];

        if (value === null || value === '') {
          delete queryCopy[key];
        }
      }

      this.$rootScope.$broadcast('ORGANIZATION.SEARCH', query);
      this.$mdDialog.hide();
    };
  }
}

SearchOrganizationController.$inject = [
  'angular',
  '$rootScope',
  '$scope',
  '$mdDialog'
];