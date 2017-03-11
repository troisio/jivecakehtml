export default class ApplicationService {
  constructor($http, Application, settings) {
    this.$http = $http;
    this.settings = settings;
    this.application = new Application();
    this.application.name = 'JiveCake';
    this.application.id = '55865027c1fcce003aa0aa43';
  }

  echo() {
    const url = [this.settings.jivecakeapi.uri, 'tool', 'echo'].join('/');
    return this.$http.get(url);
  }

  getApplication() {
    return this.application;
  }

  getObjectClassName() {
    return 'Application';
  }

  getWritePermission() {
    return 0;
  }

  getReadPermission() {
    return 1;
  }
}

ApplicationService.$inject = ['$http', 'Application', 'settings'];