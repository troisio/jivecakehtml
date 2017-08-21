export default class UIService {
  constructor($window, $q, $http, $mdToast, $mdDialog, settings) {
    this.$window = $window;
    this.$q = $q;
    this.$http = $http;
    this.$mdToast = $mdToast;
    this.$mdDialog = $mdDialog;
    this.settings = settings;
    this.timeSelections = this.getTimeSelections();
  }

  logInteraction(token, body) {
    const headers = {};

    if (token !== null) {
      headers.Authorization = 'Bearer ' + token;
    }

    const url = [this.settings.jivecakeapi.uri, 'log', 'ui'].join('/');
    return this.$http.post(url, body, {
      headers: headers
    });
  }

  getTimeSelections() {
    const result = [];

    for (let minutes = 0; minutes <= 60 * 24 - 5; minutes += 5) {
      let data = {
        hour: Math.floor(minutes / 60),
        minute: minutes % 60
      };

      data.label = (data.hour < 10 ? '0' + data.hour : data.hour) + ':' + (data.minute < 10 ? '0' + data.minute : data.minute);
      result.push(data);
    }

    return result;
  }

  load() {
    const close = this.$q.defer();
    const dialog = this.$mdDialog.show({
      onComplete: () => {
        close.promise.then(() => {
          this.$mdDialog.hide();
        });
      },
      template: '<md-dialog layout-align="center center" aria-label="Loading"><md-input-container flex><md-progress-circular md-mode="indeterminate"></md-progress-circular></md-input-container>',
      escapeToClose: false
    });

    return {
      close: close,
      dialog: dialog
    };
  }

  notify(text) {
    return this.$mdToast.show(
      this.$mdToast.simple()
        .content(text)
        .position('pos top right')
        .hideDelay(3000)
    );
  }

  getDefaultItemCartSelectionSize() {
    return 30;
  }

  getMaximumItemCartSelectionSize() {
    return 100;
  }
}

UIService.$inject = ['$window', '$q', '$http', '$mdToast', '$mdDialog', 'settings'];