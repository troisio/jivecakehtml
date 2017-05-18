export default class Event {
  constructor() {
    this.id = null;
    this.name = null;
    this.description = null;
    this.status = null;
    this.organizationId = null;
    this.paymentProfileId = null;
    this.currency = null;
    this.timeStart = null;
    this.timeEnd = null;
    this.timeCreated = null;
    this.timeUpdated = null;
    this.lastActivity = null;
  }

  hasCurrencyAndPaymentProfile() {
    return this.paymentProfileId !== null && this.currency !== null;
  }
}