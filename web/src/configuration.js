import applicationPartialIndex from './application/partial/index.html';
import applicationInternal from './application/partial/internal.html';
import accessPartialOAuthRedirect from './access/partial/oauthRedirect.html';
import eventPartialRead from './event/partial/read.html';
import itemPartialRead from './item/partial/read.html';
import itemPartialUpdate from './item/partial/update.html';
import eventPartialUpdate from './event/partial/update.html';
import organizationRead from './organization/partial/read.html';
import organizationUpdate from './organization/partial/update.html';
import transactionRead from './transaction/partial/read.html';
import transactionCreate from './transaction/partial/create.html';
import accountPartial from './user/partial/update.html';
import myTransactionPartial from './transaction/partial/myTransaction.html';
import publicPartialEvent from './public/partial/event.html';

export default [
  '$locationProvider',
  '$stateProvider',
  '$urlRouterProvider',
  '$mdThemingProvider',
  '$mdDateLocaleProvider',
  '$httpProvider',
  'settings',
  'lockProvider',
   function(
     $locationProvider,
     $stateProvider,
     $urlRouterProvider,
     $mdThemingProvider,
     $mdDateLocaleProvider,
     $httpProvider,
     settings,
     lockProvider
   ) {
    $httpProvider.interceptors.push('HTTPInterceptor');

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: true,
      rewriteLinks: false
    });

    $mdThemingProvider.definePalette('customBlue', $mdThemingProvider.extendPalette('light-blue', {
      contrastDefaultColor: 'light',
      contrastDarkColors: ['50'],
      '50': 'ffffff'
    }));

    $mdThemingProvider.theme('default').primaryPalette('customBlue', {
      'default': '500',
      'hue-1': '50'
    }).accentPalette('pink');

    $mdThemingProvider.theme('input', 'default').primaryPalette('grey');

    $stateProvider.state('application', {
      controller: 'ApplicationController',
      controllerAs: 'controller',
      template: applicationPartialIndex,
      abstract: true
    })
    .state('application.internal', {
      controller: 'InternalApplicationController',
      template: applicationInternal
    })
    .state('application.oauthRedirect', {
      url: '/oauth/redirect?state&code',
      controller: 'OAuthRedirectController',
      template: accessPartialOAuthRedirect
    })
    .state('application.internal.event', {
      abstract: true,
      url : '/event',
      template: '<div ui-view></div>',
      controller: 'EventController'
    })
    .state('application.internal.event.read', {
      url : '?organizationId&highlight',
      template: eventPartialRead,
      controller: 'ReadEventController',
      controllerAs: 'controller'
    })
    .state('application.internal.event.update', {
      url : '/{eventId}/update',
      template: eventPartialUpdate,
      controller: 'UpdateEventController',
      controllerAs: 'controller'
    })
    .state('application.internal.item', {
      abstract: true,
      url: '/item',
      template: '<div ui-view></div>',
      controller: 'ItemController'
    })
    .state('application.internal.item.read', {
      url : '?eventId&highlight',
      template: itemPartialRead,
      controller: 'ReadItemController',
      controllerAs: 'controller'
    })
    .state('application.internal.item.update', {
      url: '/{itemId}/update',
      template: itemPartialUpdate,
      controller: 'UpdateItemController',
      controllerAs: 'controller'
    })
    .state('application.internal.organization', {
      abstract: true,
      template: '<div ui-view></div>',
      controller: 'OrganizationController'
    })
    .state('application.internal.organization.read', {
      url: '/organization?highlight',
      template: organizationRead,
      controller: 'ReadOrganizationController',
      controllerAs: 'controller'
    })
    .state('application.internal.organization.update', {
      url: '/organization/{organizationId}/update',
      template: organizationUpdate,
      controller: 'UpdateOrganizationController',
      controllerAs: 'controller'
    })
    .state('application.internal.transaction', {
      abstract: true,
      url: '/transaction',
      controller: 'TransactionController',
      template: '<ui-view flex layout="column"></ui-view>'
    })
    .state('application.internal.transaction.read', {
      url: '?organizationId&eventId&itemId&id',
      template: transactionRead,
      controller: 'ReadTransactionController',
      controllerAs: 'controller'
    })
    .state('application.internal.transaction.create', {
      url: '/{itemId}/create',
      template: transactionCreate,
      controller: 'CreateTransactionController',
      controllerAs: 'controller'
    })
    .state('application.internal.account', {
      url: '/update',
      template: accountPartial,
      controller: 'UpdateAccountController',
      controllerAs: 'controller'
    })
    .state('application.public', {
      abstract : true,
      template: '<ui-view></ui-view>',
      controller: 'PublicController'
    })
    .state('application.event', {
      url: '/e/{hash}',
      template: publicPartialEvent,
      controller: 'PublicEventController',
      controllerAs: 'controller'
    })
    .state('application.internal.myTransaction', {
      url: '/transaction/{user_id}',
      template: myTransactionPartial,
      controller: 'MyTransactionController',
      controllerAs: 'controller'
    });

    lockProvider.init({
      domain: settings.oauth.auth0.domain,
      clientID: settings.oauth.auth0.client_id
    });
  }
];