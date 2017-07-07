export default class Transaction {
  constructor() {
    this.id = null;
    this.parentTransactionId = null;
    this.itemId = null;
    this.eventId = null;
    this.organizationId = null;
    this.user_id = null;
    this.linkedId = null;
    this.linkedObjectClass = null;
    this.status = null;
    this.paymentStatus = null;
    this.quantity = null;
    this.given_name = null;
    this.middleName = null;
    this.family_name = null;
    this.amount = null;
    this.currency = null;
    this.email = null;
    this.leaf = null;
    this.timeCreated = null;
  }

  isVendorTransaction() {
    return this.linkedObjectClass === 'StripeCharge' || this.linkedObjectClass === 'PaypalPayment';
  }

  canRefund() {
    return this.isVendorTransaction() && this.status === 0 && this.leaf;
  }
}