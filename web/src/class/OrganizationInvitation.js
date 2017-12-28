export default class OrganizationInvitation {
  constructor() {
    this.id = null;
    this.organizationId = null;
    this.email = null;
    this.read = false;
    this.write = false;
    this.userIds = null;
    this.timeCreated = null;
    this.timeAccepted = null;
  }
}