export default class PaymentProfile {
  constructor() {
    this.id = null;
    this.name = null;
    this.organizationId = null;
    this.timeCreated = null;
  }

  isPaypal() {
    const hasEmail = (typeof this.email) !== 'undefined';
    return hasEmail;
  }
}