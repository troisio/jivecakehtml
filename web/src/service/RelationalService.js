export default class RelationalService {
  oneToOneJoin(subjects, subjectForeignKey, foreignEntities, foreignEntityKey) {
    const groups = this.groupBy(foreignEntities, true, function(subject) {
      return subject[foreignEntityKey];
    });

    return subjects.map(function(subject) {
      const key = subject[subjectForeignKey];
      return {
        entity: subject,
        foreign: key in groups ? groups[key] : null
      };
    });
  }

  leftJoin(subjects, subjectProperty, foreignEntities, foreignEntityPropery) {
    const foreignByGroup = this.groupBy(foreignEntities, false, function(subject) {
      return subject[foreignEntityPropery];
    });

    return subjects.map(function(subject) {
      const key = subject[subjectProperty];

      return {
        entity: subject,
        foreign: key in foreignByGroup ? foreignByGroup[key] : []
      };
    });
  }

  groupBy(subjects, oneToOne, getProperty) {
    let reduction;

    if (oneToOne) {
      reduction = function(previous, current) {
        const key = getProperty(current);
        previous[key] = current;
        return previous;
      };
    } else {
      reduction = function(previous, current) {
        const key = getProperty(current);

        if (key in previous) {
          previous[key].push(current);
        } else {
          previous[key] = [current];
        }

        return previous;
      };
    }

    return subjects.reduce(reduction, {});
  }
}