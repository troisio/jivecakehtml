export default class Event {
  constructor() {
    this.id = null;
    this.name = null;
    this.hash = null;
    this.description = null;
    this.status = null;
    this.requireOrganizationName = null;
    this.requireName = null;
    this.assignIntegerToRegistrant = null;
    this.requirePhoto = null;
    this.qr = null;
    this.facebookEventId = null;
    this.twitterUrl = null;
    this.websiteUrl = null;
    this.previewImageUrl = null;
    this.organizationId = null;
    this.entityAssetConsentId = null;
    this.paymentProfileId = null;
    this.userData = null;
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