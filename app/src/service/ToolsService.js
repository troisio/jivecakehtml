import angular from 'angular';

export default class ToolsService {
  stateParamsToQuery(subject) {
    return Object.keys(subject).reduce((previousValue, key) => {
      const value = subject[key];

      if (Array.isArray(value)) {
        previousValue[key] = value;
      } else if (typeof value !== 'undefined') {
        previousValue[key] = [value];
      }

      return previousValue;
    }, {});
  }

  toObject(subject, constructor) {
    const result = new constructor();
    this.overWrite(subject, result);
    return result;
  }

  toObjects(subjects, constructor) {
    return subjects.map((subject) => {
      return this.toObject(subject, constructor);
    });
  }

  overWrite(subject, destination) {
    const destinationProperties = Object.getOwnPropertyNames(destination);

    destinationProperties.forEach(function(property) {
      if (property in subject) {
        destination[property] = subject[property];
      }
    });
  }

  maintainKeys(subject, keys) {
    const result = angular.copy(subject);
    const set = new Set();
    keys.forEach(set.add, set);

    for (let property in result) {
      if (!(set.has(property))) {
        delete result[property];
      }
    }

    return result;
  }
}