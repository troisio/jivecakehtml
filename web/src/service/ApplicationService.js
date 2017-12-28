export default class ApplicationService {
  constructor($http, Application, settings) {
    this.$http = $http;
    this.settings = settings;
    this.application = new Application();
    this.application.name = 'JiveCake';
    this.application.id = '55865027c1fcce003aa0aa43';
  }

  getApplication() {
    return this.application;
  }
}

ApplicationService.$inject = ['$http', 'Application', 'settings'];