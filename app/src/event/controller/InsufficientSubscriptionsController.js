export default class InsufficientSubscriptionsController {
  constructor($scope, $mdDialog, $state, features, organization) {
    this.$mdDialog = $mdDialog;
    this.$state = $state;

    $scope.features = features;
    $scope.organization = organization;
  }

  updateOrganization(organization) {
    this.$state.go('application.internal.organization.update', {organizationId: organization.id});
    this.$mdDialog.hide();
  }
}

InsufficientSubscriptionsController.$inject = ['$scope', '$mdDialog', '$state', 'features', 'organization'];