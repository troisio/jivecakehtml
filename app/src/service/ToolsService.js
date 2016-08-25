export default class ToolsService {
  constructor(angular, $window) {
    this.angular = angular;
    this.$window = $window;
  }

  stateParamsToQuery(subject) {
    return this.$window.Object.keys(subject).reduce((previousValue, key) => {
      const value = subject[key];

      if (this.$window.Array.isArray(value)) {
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
    const destinationProperties = this.$window.Object.getOwnPropertyNames(destination);

    destinationProperties.forEach(function(property) {
      if (property in subject) {
        destination[property] = subject[property];
      }
    });
  }

  maintainKeys(subject, keys) {
    const result = this.angular.copy(subject);
    const set = new this.$window.Set();
    keys.forEach(set.add, set);

    for (let property in result) {
      if (!(set.has(property))) {
        delete result[property];
      }
    }

    return result;
  }
}

ToolsService.$inject = ['angular', '$window'];