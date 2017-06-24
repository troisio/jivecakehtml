import PaymentProfile from './PaymentProfile';

export default class StripePaymentProfile extends PaymentProfile {
  constructor() {
    super();
    this.stripe_publishable_key = null;
    this.stripe_user_id = null;
    this.email = null;
  }
}