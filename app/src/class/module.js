import angular from 'angular';
import Application from './Application';
import EntityAsset from './EntityAsset';
import Event from './Event';
import Feature from './Feature';
import Item from './Item';
import JiveCakeLocalStorage from './JiveCakeLocalStorage';
import Organization from './Organization';
import OrganizationFeature from './OrganizationFeature';
import Page from './Page';
import PaymentDetail from './PaymentDetail';
import PaymentProfile from './PaymentProfile';
import PaypalPaymentProfile from './PaypalPaymentProfile';
import Permission from './Permission';
import SearchEntity from './SearchEntity';
import StripePaymentProfile from './StripePaymentProfile';
import Transaction from './Transaction';

export default angular.module('jivecakeclass', [])
  .constant('Application', Application)
  .constant('EntityAsset', EntityAsset)
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
  .constant('PaypalPaymentProfile', PaypalPaymentProfile)
  .constant('Permission', Permission)
  .constant('SearchEntity', SearchEntity)
  .constant('StripePaymentProfile', StripePaymentProfile);