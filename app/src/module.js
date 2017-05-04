import './polyfill/assign';
import './polyfill/find';
import './polyfill/from';

import settings from './settings';

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

/*bootstrap lovefield*/

const builder = lf.schema.create('jivecake', 1);
builder.createTable('Permission')
  .addColumn('id', lf.Type.STRING)
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('objectId', lf.Type.STRING)
  .addColumn('include', lf.Type.INTEGER)
  .addColumn('objectClass', lf.Type.STRING)
  .addColumn('permissions', lf.Type.ARRAY_BUFFER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addPrimaryKey(['id']);

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
    '$window',
    '$location',
    '$state',
    '$mdDialog',
    'OrganizationService',
    'PermissionService',
    'UIService',
    'StorageService',
    'Auth0Service',
    'JiveCakeLocalStorage',
    function(
      lock,
      angular,
      $window,
      $location,
      $state,
      $mdDialog,
      organizationService,
      permissionService,
      uiService,
      storageService,
      auth0Service,
      JiveCakeLocalStorage
    ) {
      lock.on('authenticated', function(auth) {
        const storage = new JiveCakeLocalStorage();
        storage.timeCreated = new $window.Date().getTime();
        storage.auth = auth;
        storageService.write(storage);

        permissionService.search(auth.idToken, {
          user_id: auth.idTokenPayload.sub,
          objectClass: organizationService.getObjectClassName()
        }).then(function(search) {
          if (typeof auth.state === 'undefined') {
            $state.go('application.internal.myTransaction', {
              user_id: auth.idTokenPayload.sub
            }, {
              reload: true
            });
          } else {
            const routerParameters = angular.fromJson(auth.state);

            if (routerParameters.name === 'application.public.home') {
              if (search.entity.length > 0) {
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