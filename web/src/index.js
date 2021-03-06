import 'babel-polyfill';
import './polyfill/assign';
import './polyfill/find';
import './polyfill/findIndex';
import './polyfill/from';
import 'whatwg-fetch';

import angular from 'angular';
import lockFromState from './lockFromState';

import 'event-source-polyfill';
import 'ui-cropper';

import 'script-loader!ui-cropper/compile/minified/ui-cropper.js';

import lf from 'lovefield';
import run from './run';
import angularMaterialDataTable from 'angular-material-data-table';
import angularAnimate from 'angular-animate';
import angularAria from 'angular-aria';
import angularMessages from 'angular-messages';
import angularSanitize from 'angular-sanitize';
import uiRouter from '@uirouter/angularjs';
import angularJwt from 'angular-jwt';
import ngMessages from 'angular-messages';
import ngMaterial from 'angular-material';
import ngIcons from 'angular-material-icons';

import settings from './settings';
import builder from './database';

import featureTypeFilter from './angularcomponents/featureTypeFilter';
import HTTPInterceptor from './angularcomponents/HTTPInterceptor';
import absoluteValue from './angularcomponents/absoluteValue';
import userIdentificationFilter from './angularcomponents/userIdentificationFilter';
import transactionCSSClass from './angularcomponents/transactionCSSClass';
import browserTimeZoneAbbreviation from './angularcomponents/browserTimeZoneAbbreviation';
import currencySymbolFilter from './angularcomponents/currencySymbolFilter';

import jiveCakeClassModule from './class/module';
import jiveCakeServiceModule from './service/module';
import configuration from './configuration';

import ApplicationController from './application/controller/ApplicationController';
import InternalApplicationController from './application/controller/InternalApplicationController';

import OAuthRedirectController from './access/controller/OAuthRedirectController';
import EmailVerifiedController from './access/controller/EmailVerifiedController';
import SessionWarningController from './access/controller/SessionWarningController';
import ImpersonationController from './access/controller/ImpersonationController';

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

import CreateOrganizationInvitationController from './organization/controller/CreateOrganizationInvitationController';
import CreateConsentAssetController from './organization/controller/CreateConsentAssetController';
import CreateOrganizationController from './organization/controller/CreateOrganizationController';
import OrganizationController from './organization/controller/OrganizationController';
import ReadOrganizationController from './organization/controller/ReadOrganizationController';
import UpdateOrganizationController from './organization/controller/UpdateOrganizationController';

import CreatePaymentProfileController from './payment/profile/controller/CreatePaymentProfileController';

import OrderErrorController from './public/controller/OrderErrorController';
import PublicEventController from './public/controller/PublicEventController';
import MyTransactionController from './transaction/controller/MyTransactionController';

import CreateTransactionController from './transaction/controller/CreateTransactionController';
import TransactionController from './transaction/controller/TransactionController';
import ReadTransactionController from './transaction/controller/ReadTransactionController';
import ViewTransactionController from './transaction/controller/ViewTransactionController';

import UpdateAccountController from './user/controller/UpdateAccountController';

import Promise from 'promise-polyfill';

if (!window.Promise) {
  window.Promise = Promise;
}

const onAuthentication = new Promise((resolve, reject) => {
  const lock = lockFromState({});

  lock.on('authorization_error', (authorization_error) => {
    reject(authorization_error);
  });

  lock.on('authenticated', (auth) => {
    fetch(`${settings.jivecakeapi.uri}/auth0/api/v2/users/${auth.idTokenPayload.sub}`, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then((profile) => {
      resolve({auth, profile});
    }, reject);
  });
});

const module = angular.module('jivecakeweb', [
  jiveCakeClassModule.name,
  jiveCakeServiceModule.name,
  ngMessages,
  ngMaterial,
  ngIcons,
  angularSanitize,
  uiRouter,
  angularMaterialDataTable,
  angularAnimate,
  angularAria,
  angularMessages,
  angularJwt,
  'uiCropper'
])
.filter('featureTypeFilter', featureTypeFilter)
.service('HTTPInterceptor', HTTPInterceptor)
.filter('absoluteValue', absoluteValue)
.filter('userIdentificationFilter', userIdentificationFilter)
.filter('transactionCSSClass', transactionCSSClass)
.filter('browserTimeZoneAbbreviation', browserTimeZoneAbbreviation)
.filter('currencySymbolFilter', currencySymbolFilter)
.constant('settings', settings)
.constant('onAuthentication', onAuthentication)
.config(configuration)
.run(run)
.controller('ApplicationController', ApplicationController)
.controller('InternalApplicationController', InternalApplicationController)

.controller('OAuthRedirectController', OAuthRedirectController)
.controller('EmailVerifiedController', EmailVerifiedController)
.controller('SessionWarningController', SessionWarningController)
.controller('ImpersonationController', ImpersonationController)

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

.controller('CreateOrganizationInvitationController', CreateOrganizationInvitationController)
.controller('CreateConsentAssetController', CreateConsentAssetController)
.controller('CreateOrganizationController', CreateOrganizationController)
.controller('OrganizationController', OrganizationController)
.controller('ReadOrganizationController', ReadOrganizationController)
.controller('UpdateOrganizationController', UpdateOrganizationController)

.controller('CreatePaymentProfileController', CreatePaymentProfileController)

.controller('OrderErrorController', OrderErrorController)
.controller('PublicEventController', PublicEventController)
.controller('MyTransactionController', MyTransactionController)

.controller('CreateTransactionController', CreateTransactionController)
.controller('TransactionController', TransactionController)
.controller('ReadTransactionController', ReadTransactionController)
.controller('ViewTransactionController', ViewTransactionController)

.controller('UpdateAccountController', UpdateAccountController);

builder.connect({
  storeType: lf.schema.DataStoreType.MEMORY,
  onUpgrade: function(db) {
    const tablesInSchema = builder.getSchema().tables().map(table => table.getName());
    const rawDB = db.getRawDBInstance();

    for (let index = 0; index < rawDB.objectStoreNames.length; index++) {
      const name = rawDB.objectStoreNames[index];
      if (!tablesInSchema.includes(name)) {
        db.dropTable(name);
      }
    }

    return Promise.resolve();
  }
}).then(function(db) {
  module.constant('db', db);

  const deleteFutures = db.getSchema().tables().map(table => {
    return db.delete()
      .from(db.getSchema().table(table.getName()))
      .exec();
  });

  Promise.all(deleteFutures).then(function() {
    angular.element(document).ready(() => {
      angular.bootstrap(document, ['jivecakeweb'], {strictDi: true});
    });
  });
}, (e) => {
  throw new Error(e);
});