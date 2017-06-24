import angular from 'angular';


import Application from './Application';
import ClientConnection from './ClientConnection';
import Event from './Event';
import Feature from './Feature';
import Item from './Item';
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
import StripePaymentProfile from './StripePaymentProfile';
import Transaction from './Transaction';
import UserInterfaceEvent from './UserInterfaceEvent';

export default angular.module('jivecakeclass', [])
  .constant('Application', Application)
  .constant('ClientConnection', ClientConnection)
  .constant('Event', Event)
  .constant('Feature', Feature)
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
  .constant('StripePaymentProfile', StripePaymentProfile)
  .constant('UserInterfaceEvent', UserInterfaceEvent);