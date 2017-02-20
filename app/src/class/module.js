import Application from './Application';
import ClientConnection from './ClientConnection';
import Event from './Event';
import Feature from './Feature';
import IndexedOrganizationNode from './IndexedOrganizationNode';
import Item from './Item';
import Transaction from './Transaction';
import JiveCakeLocalStorage from './JiveCakeLocalStorage';
import Organization from './Organization';
import OrganizationFeature from './OrganizationFeature';
import Page from './Page';
import PaymentDetail from './PaymentDetail';
import PaymentProfile from './PaymentProfile';
import PaypalIpn from './PaypalIpn';
import PaypalPaymentProfile from './PaypalPaymentProfile';
import Permission from './Permission';
import SearchEntity from './SearchEntity';
import SubscriptionPaymentDetail from './SubscriptionPaymentDetail';
import TransactionLoader from './TransactionLoader';

export default angular.module('jivecakeclass', [])
  .constant('Application', Application)
  .constant('ClientConnection', ClientConnection)
  .constant('Event', Event)
  .constant('Feature', Feature)
  .constant('IndexedOrganizationNode', IndexedOrganizationNode)
  .constant('Item', Item)
  .constant('Transaction', Transaction)
  .constant('JiveCakeLocalStorage', JiveCakeLocalStorage)
  .constant('Organization', Organization)
  .constant('OrganizationFeature', OrganizationFeature)
  .constant('Page', Page)
  .constant('PaymentDetail', PaymentDetail)
  .constant('PaymentProfile', PaymentProfile)
  .constant('PaypalIpn', PaypalIpn)
  .constant('PaypalPaymentProfile', PaypalPaymentProfile)
  .constant('Permission', Permission)
  .constant('SearchEntity', SearchEntity)
  .constant('SubscriptionPaymentDetail', SubscriptionPaymentDetail)
  .constant('TransactionLoader', TransactionLoader);