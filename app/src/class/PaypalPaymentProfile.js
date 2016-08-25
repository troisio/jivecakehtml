import PaymentProfile from './PaymentProfile';

export default class PaypalPaymentProfile extends PaymentProfile {
  constructor() {
    super();
    this.email = null;
  }
}