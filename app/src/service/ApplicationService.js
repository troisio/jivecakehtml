export default class ApplicationService {
  constructor(Application) {
    this.application = new Application();
    this.application.name = 'JiveCake';
    this.application.id = '55865027c1fcce003aa0aa43';
  }

  getApplication() {
    return this.application;
  }

  getObjectClassName() {
    return 'Application';
  }

  getWritePermission() {
    return 'WRITE';
  }

  getReadPermission() {
    return 'READ';
  }
}

ApplicationService.$inject = ['Application'];