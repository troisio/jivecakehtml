export default class CreateOrganizationFeatureController {
  constructor(angular, $rootScope, featureService, uiService, storageService, OrganizationFeature, organization) {
    this.angular = angular;
    this.$rootScope = $rootScope;
    this.featureService = featureService;
    this.storage = storageService.read();
    this.organization = organization;
    this.uiService = uiService;

    this.feature = new OrganizationFeature();
  }

  submit(feature) {
    const loader = this.uiService.load();
    feature.type = this.featureService.getOrganizationEventFeature();

    const featureCopy = this.angular.copy(feature);
    featureCopy.timeStart = feature.timeStart.getTime();
    featureCopy.timeEnd = feature.timeEnd.getTime();

    this.featureService.create(this.storage.auth.idToken, this.organization.id, featureCopy).then((feature) => {
      loader.dialog.finally(() => {
        this.uiService.notify('Organization feature created');
        this.$rootScope.$broadcast('FEATURE.ORGANIZATION.WRITE', feature);
      });
    }, () => {
      loader.dialog.finally(() => {
        this.uiService.notify('Unable to create organization feature');
      });
    }).finally(() => {
      loader.close.resolve();
    });
  }
}

CreateOrganizationFeatureController.$inject = ['angular', '$rootScope', 'FeatureService', 'UIService', 'StorageService', 'OrganizationFeature', 'organization'];