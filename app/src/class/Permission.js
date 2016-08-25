export default class Permission {
  constructor() {
    this.id = null;
    this.user_id = null;
    this.objectId = null;
    this.include = null;
    this.objectClass = null;
    this.permissions = null;
    this.timeCreated = null;
  }

  has(target) {
    let result;

    if (this.include === 0) {
      result = true;
    } else {
      const searchResultType = typeof this.permissions.find(function(permission) {
        return permission === target;
      });

      result = this.include === 1 ? searchResultType !== 'undefined' : searchResultType === 'undefined';
    }

    return result;
  }
}