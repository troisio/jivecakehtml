export default class UIService {
  constructor($window, $q, $mdToast, $mdDialog) {
    this.$window = $window;
    this.$q = $q;
    this.$mdToast = $mdToast;
    this.$mdDialog = $mdDialog;
    this.timeSelections = this.getTimeSelections();

    this.toast = {
      position: 'pos top right',
      hideDelay: 3000
    };
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
        close.promise.finally(() => {
          this.$mdDialog.hide(dialog, null);
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
        .position(this.toast.position)
        .hideDelay(this.toast.hideDelay)
    );
  }

  getDefaultItemCartSelectionSize() {
    return 30;
  }
}

UIService.$inject = ['$window', '$q', '$mdToast', '$mdDialog'];