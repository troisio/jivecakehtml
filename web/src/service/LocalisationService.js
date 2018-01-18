import localisation from '../localisation.json';

export default class LocalisationService {
  constructor() {
    const translationsMap = {};

    for (let key in localisation) {
      const translations = localisation[key];
      translationsMap[key] = {};

      for (let [codes, text] of translations) {
        for (let code of codes) {
          translationsMap[key][code] = text;
        }
      }
    }

    this.translations = translationsMap;
  }

  tranlsateFrom(term, language) {
    return this.translations[term][language.toLowerCase()];
  }

  translate(term) {
    let language;

    if (window.navigator.languages) {
      language = window.navigator.languages[0].toLowerCase();
    } else {
      language = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
    }

    const translations = this.translations[term];
    return language in translations ? translations[language] : translations['en-us'];
  }
}