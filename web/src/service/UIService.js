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

  getLocalizationSettings(navigator) {
    let language = 'en-us';

    if (navigator.languages) {
      language = navigator.languages[0];
    } else if (navigator.language) {
      language = navigator.language;
    }

    language = language.toLowerCase();

    const currencyLanguages = [
      {
        currency: 'AUD',
        languages: ['en-au']
      },
      {
        currency: 'BBD',
        languages: []
      },
      {
        currency: 'BRL',
        languages: ['pt-br']
      },
      {
        currency: 'CAD',
        languages: ['en-ca', 'fr-ca']
      },
      {
        currency: 'EUR',
        languages: ['en-ie', 'ga', 'it', 'de', 'de-de', 'de-ch', 'nl', 'fr', 'fr-fr', 'fr-mc', 'gd', 'gd-ie', 'es-es', 'pt']
      },
      {
        currency: 'FJD',
        languages: ['fj']
      },
      {
        currency: 'GBP',
        languages: ['en-gb']
      },
      {
        currency: 'ILS',
        languages: ['he', 'ji']
      },
      {
        currency: 'ISK',
        languages: ['is']
      },
      {
        currency: 'NZD',
        languages: ['en-nz']
      },
      {
        currency: 'RUS',
        languages: ['ru', 'ru-mo']
      },
      {
        currency: 'SEK',
        languages: ['sv', 'sv-fl', 'sv-sv']
      },
      {
        currency: 'TTD',
        languages: ['en-tt']
      },
      {
        currency: 'USD',
        languages: ['en-us', 'es-pr']
      },
      {
        currency: 'ZAR',
        languages: ['af', 'en-za', 'zu']
      }
    ];

    let currency = null;

    currencyIteration:
    for (let currencyLanguage of currencyLanguages) {
      for (let l of currencyLanguage.languages) {
        if (l === language) {
          currency = currencyLanguage.currency;
          break currencyIteration;
        }
      }
    }

    return {
      language: language,
      currency: currency
    };
  }

  getDefaultItemCartSelectionSize() {
    return 30;
  }

  getMaximumItemCartSelectionSize() {
    return 100;
  }
}

UIService.$inject = ['$window', '$q', '$http', '$mdToast', '$mdDialog', 'settings'];