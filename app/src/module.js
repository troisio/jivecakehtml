import './polyfill/assign';
import './polyfill/find';
import './polyfill/from';

import settings from './settings';
import builder from './database';

import featureTypeFilter from './angularcomponents/featureTypeFilter';
import HTTPInterceptor from './angularcomponents/HTTPInterceptor';
import absoluteValue from './angularcomponents/absoluteValue';
import userIdentificationFilter from './angularcomponents/userIdentificationFilter';
import transactionCSSClass from './angularcomponents/transactionCSSClass';
import browserTimeZoneAbbreviation from './angularcomponents/browserTimeZoneAbbreviation';

import jiveCakeClassModule from './class/module';
import jiveCakeServiceModule from './service/module';
import configuration from './application/configuration';

import ApplicationController from './application/controller/ApplicationController';
import HomeController from './application/controller/HomeController';
import InternalApplicationController from './application/controller/InternalApplicationController';

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
import OrganizationController from './organization/controller/OrganizationController';
import ReadOrganizationController from './organization/controller/ReadOrganizationController';
import UpdateOrganizationController from './organization/controller/UpdateOrganizationController';

import CreatePaymentProfileController from './payment/profile/controller/CreatePaymentProfileController';

import PublicController from './public/controller/PublicController';
import PublicEventController from './public/controller/PublicEventController';
import PublicEventItemController from './public/controller/PublicEventItemController';
import MyTransactionController from './transaction/controller/MyTransactionController';

import CreateTransactionController from './transaction/controller/CreateTransactionController';
import TransactionController from './transaction/controller/TransactionController';
import ReadTransactionController from './transaction/controller/ReadTransactionController';
import TransferPassController from './transaction/controller/TransferPassController';

import UpdateAccountController from './user/controller/UpdateAccountController';

builder.connect({storeType: lf.schema.DataStoreType.MEMORY}).then(function(db) {
  angular.module('jivecakeweb', [
    jiveCakeClassModule.name,
    jiveCakeServiceModule.name,
    'ngMessages',
    'ngMaterial',
    'ngMdIcons',
    'ngSanitize',
    'ui.router',
    'auth0.lock',
    'angular-jwt',
    'md.data.table',
    'monospaced.qrcode'
  ])
  .filter('featureTypeFilter', featureTypeFilter)
  .service('HTTPInterceptor', HTTPInterceptor)
  .filter('absoluteValue', absoluteValue)
  .filter('userIdentificationFilter', userIdentificationFilter)
  .filter('transactionCSSClass', transactionCSSClass)
  .filter('browserTimeZoneAbbreviation', browserTimeZoneAbbreviation)
  .constant('settings', settings)
  .constant('db', db)
  .config(configuration)
  .run([
    'lock',
    'angular',
    '$location',
    '$state',
    '$q',
    '$mdDialog',
    'OrganizationService',
    'PermissionService',
    'TransactionService',
    'UIService',
    'StorageService',
    'Auth0Service',
    'JiveCakeLocalStorage',
    'SearchEntity',
    function(
      lock,
      angular,
      $location,
      $state,
      $q,
      $mdDialog,
      organizationService,
      permissionService,
      transactionService,
      uiService,
      storageService,
      auth0Service,
      JiveCakeLocalStorage,
      SearchEntity
    ) {
      lock.on('authenticated', function(auth) {
        lock.getUserInfo(auth.accessToken, function(error, profile) {
          if (typeof err === 'undefined') {
            const storage = new JiveCakeLocalStorage();
            storage.timeCreated = new Date().getTime();
            storage.auth = auth;
            storage.profile = profile;
            storageService.write(storage);

            permissionService.search(auth.idToken, {
              user_id: auth.idTokenPayload.sub,
              objectClass: 'Organization'
            }).then(function(permissionResult) {
              const permissions = permissionResult.entity;
              const organizationIds = permissions.map(permission => permission.objectId);

              const transactionFuture = organizationIds.length === 0 ? $q.resolve(new SearchEntity()) :
                transactionService.search(auth.idToken, {
                  limit: 1,
                  organizationId: organizationIds,
                  order: '-timeCreated'
                });

              transactionFuture.then(transactionSearch => {
                const transactions = transactionSearch.entity;

                if (typeof auth.state === 'undefined') {
                  if (transactions.length > 0) {
                    $state.go('application.internal.transaction.read', {}, {reload: true});
                  } else if (permissions.length > 0) {
                    $state.go('application.internal.organization.read', {}, {reload: true});
                  } else {
                    $state.go('application.internal.myTransaction', {
                      user_id: auth.idTokenPayload.sub
                    }, {
                      reload: true
                    });
                  }
                } else {
                  const routerParameters = angular.fromJson(auth.state);

                  if (routerParameters.name === 'application.public.home') {
                    if (permissions.length > 0) {
                      $state.go('application.internal.organization.read', {}, {reload: true});
                    } else {
                      $state.go('application.internal.myTransaction', {
                        user_id: auth.idTokenPayload.sub
                      }, {
                        reload: true
                      });
                    }
                  } else {
                    $state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
                  }
                }
              });
            });
          } else {
            uiService.notify('Unable to login');
          }
        });
      }, function() {
        uiService.notify('Unable to login');
      });
    }
  ])
  .controller('ApplicationController', ApplicationController)
  .controller('HomeController', HomeController)
  .controller('InternalApplicationController', InternalApplicationController)

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
  .controller('OrganizationController', OrganizationController)
  .controller('ReadOrganizationController', ReadOrganizationController)
  .controller('UpdateOrganizationController', UpdateOrganizationController)

  .controller('CreatePaymentProfileController', CreatePaymentProfileController)

  .controller('PublicController', PublicController)
  .controller('PublicEventController', PublicEventController)
  .controller('PublicEventItemController', PublicEventItemController)
  .controller('MyTransactionController', MyTransactionController)

  .controller('CreateTransactionController', CreateTransactionController)
  .controller('TransactionController', TransactionController)
  .controller('ReadTransactionController', ReadTransactionController)
  .controller('TransferPassController', TransferPassController)

  .controller('UpdateAccountController', UpdateAccountController)
  .constant('angular', angular);

  angular.element(document).ready(() => {
    angular.bootstrap(document, ['jivecakeweb'], {strictDi: true});
  });
});