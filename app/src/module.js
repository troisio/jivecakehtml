import './polyfill/find';
import './polyfill/from';

import settings from './settings';

import featureTypeFilter from './angularcomponents/featureTypeFilter';
import HTTPInterceptor from './angularcomponents/HTTPInterceptor';
import userIdentificationFilter from './angularcomponents/userIdentificationFilter';
import browserTimeZoneAbbreviation from './angularcomponents/browserTimeZoneAbbreviation';

import jiveCakeClassModule from './class/module';
import jiveCakeServiceModule from './service/module';
import configuration from './application/configuration';

import ApplicationController from './application/controller/ApplicationController';
import HomeController from './application/controller/HomeController';
import InternalApplicationController from './application/controller/InternalApplicationController';

import CartController from './checkout/controller/CartController';
import CheckoutController from './checkout/controller/CheckoutController';
import ConfirmationController from './checkout/controller/ConfirmationController';

import OAuthRedirectController from './access/controller/OAuthRedirectController';
import EmailVerifiedController from './access/controller/EmailVerifiedController';
import SessionWarningController from './access/controller/SessionWarningController';

import CreateEventController from './event/controller/CreateEventController';
import CreateOrganizationAndEventController from './event/controller/CreateOrganizationAndEventController';
import EventController from './event/controller/EventController';
import InsufficientSubscriptionController from './event/controller/InsufficientSubscriptionsController';
import ReadEventController from './event/controller/ReadEventController';
import UpdateEventController from './event/controller/UpdateEventController';

import CreateItemController from './item/controller/CreateItemController';
import ItemController from './item/controller/ItemController';
import ReadItemController from './item/controller/ReadItemController';
import UpdateItemController from './item/controller/UpdateItemController';

import AddUserOrganizationPermissionController from './organization/controller/AddUserOrganizationPermissionController';
import CreateOrganizationController from './organization/controller/CreateOrganizationController';
import CreateOrganizationFeatureController from './organization/controller/CreateOrganizationFeatureController';
import CreateSubscriptionController from './organization/controller/CreateSubscriptionController';
import OrganizationController from './organization/controller/OrganizationController';
import ReadOrganizationController from './organization/controller/ReadOrganizationController';
import UpdateOrganizationController from './organization/controller/UpdateOrganizationController';

import CreatePaymentProfileController from './payment/profile/controller/CreatePaymentProfileController';

import PublicController from './public/controller/PublicController';
import PublicEventController from './public/controller/PublicEventController';
import PublicEventItemController from './public/controller/PublicEventItemController';
import MyTransactionController from './transaction/controller/MyTransactionController';

import CreateItemTransactionController from './transaction/controller/CreateItemTransactionController';
import ItemTransactionController from './transaction/controller/ItemTransactionController';
import ReadTransactionController from './transaction/controller/ReadTransactionController';
import TransferPassController from './transaction/controller/TransferPassController';

import UpdateAccountController from './user/controller/UpdateAccountController';

angular.module('jivecakeweb', [
  jiveCakeClassModule.name,
  jiveCakeServiceModule.name,
  'ngMessages',
  'ngMaterial',
  'ngMdIcons',
  'ngSanitize',
  'ui.router',
  'auth0',
  'angular-storage',
  'angular-jwt',
  'md.data.table',
  'hc.marked'
])
.filter('featureTypeFilter', featureTypeFilter)
.service('HTTPInterceptor', HTTPInterceptor)
.filter('userIdentificationFilter', userIdentificationFilter)
.filter('browserTimeZoneAbbreviation', browserTimeZoneAbbreviation)
.constant('settings', settings)
.config(configuration)
.run(['auth', function(auth) {
  auth.hookEvents();
}])
.controller('ApplicationController', ApplicationController)
.controller('HomeController', HomeController)
.controller('InternalApplicationController', InternalApplicationController)

.controller('CartController', CartController)
.controller('CheckoutController', CheckoutController)
.controller('ConfirmationController', ConfirmationController)

.controller('OAuthRedirectController', OAuthRedirectController)
.controller('EmailVerifiedController', EmailVerifiedController)
.controller('SessionWarningController', SessionWarningController)

.controller('CreateEventController', CreateEventController)
.controller('CreateOrganizationAndEventController', CreateOrganizationAndEventController)
.controller('EventController', EventController)
.controller('InsufficientSubscriptionController', InsufficientSubscriptionController)
.controller('ReadEventController', ReadEventController)
.controller('UpdateEventController', UpdateEventController)

.controller('CreateItemController', CreateItemController)
.controller('ItemController', ItemController)
.controller('ReadItemController', ReadItemController)
.controller('UpdateItemController', UpdateItemController)

.controller('AddUserOrganizationPermissionController', AddUserOrganizationPermissionController)
.controller('CreateOrganizationController', CreateOrganizationController)
.controller('CreateOrganizationFeatureController', CreateOrganizationFeatureController)
.controller('CreateSubscriptionController', CreateSubscriptionController)
.controller('OrganizationController', OrganizationController)
.controller('ReadOrganizationController', ReadOrganizationController)
.controller('UpdateOrganizationController', UpdateOrganizationController)

.controller('CreatePaymentProfileController', CreatePaymentProfileController)

.controller('PublicController', PublicController)
.controller('PublicEventController', PublicEventController)
.controller('PublicEventItemController', PublicEventItemController)
.controller('MyTransactionController', MyTransactionController)

.controller('CreateItemTransactionController', CreateItemTransactionController)
.controller('ItemTransactionController', ItemTransactionController)
.controller('ReadTransactionController', ReadTransactionController)
.controller('TransferPassController', TransferPassController)

.controller('UpdateAccountController', UpdateAccountController)
.constant('angular', angular);

angular.element(document).ready(() => {
  angular.bootstrap(document, ['jivecakeweb'], {strictDi: true});
});