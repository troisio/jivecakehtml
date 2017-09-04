export default class Organization {
  constructor() {
    this.id = null;
    this.parentId = null;
    this.children = null;
    this.name = null;
    this.email = null;
    this.emailConfirmed = null;
    this.timeUpdated = 0;
    this.timeCreated = 0;
    this.lastActivity = 0;
  }
}