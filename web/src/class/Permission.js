export default class Permission {
  constructor() {
    this.id = null;
    this.user_id = null;
    this.objectId = null;
    this.objectClass = null;
    this.read = false;
    this.write = false;
    this.timeCreated = null;
  }
}