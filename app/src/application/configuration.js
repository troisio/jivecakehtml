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
      abstract: true,
      templateUrl: '/src/application/partial/index.html'
    })
    .state('application.public.home', {
      url: '/',
      templateUrl: '/src/application/partial/home.html',
      controller: 'HomeController',
      controllerAs: 'controller'
    })
    .state('application.public.faq', {
      url: '/faq',
      templateUrl: '/src/application/partial/faq.html'
    })
    .state('application.public.terms', {
      url: '/terms',
      templateUrl: '/src/application/partial/terms.html'
    })
    .state('application.internal', {
      controller: 'InternalApplicationController',
      templateUrl: '/src/application/partial/internal.html'
    })
    .state('application.public.oauthRedirect', {
      url: '/oauth/redirect?scope&code&state',
      controller: 'OAuthRedirectController',
      templateUrl: '/src/access/partial/oauthRedirect.html'
    })
    .state('application.internal.event', {
      abstract: true,
      url : '/event',
      template: '<div ui-view></div>',
      controller: 'EventController'
    })
    .state('application.internal.event.read', {
      url : '?organizationId&highlight',
      templateUrl: '/src/event/partial/read.html',
      controller: 'ReadEventController',
      controllerAs: 'controller'
    })
    .state('application.internal.event.update', {
      url : '/{eventId}/update',
      templateUrl: '/src/event/partial/update.html',
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
      templateUrl: '/src/item/partial/read.html',
      controller: 'ReadItemController',
      controllerAs: 'controller'
    })
    .state('application.internal.item.update', {
      url: '/{itemId}/update',
      templateUrl: '/src/item/partial/update.html',
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
      templateUrl: '/src/organization/partial/read.html',
      controller: 'ReadOrganizationController',
      controllerAs: 'controller'
    })
    .state('application.internal.organization.update', {
      url: '/organization/{organizationId}/update',
      templateUrl: '/src/organization/partial/update.html',
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
      templateUrl: '/src/transaction/partial/read.html',
      controller: 'ReadTransactionController',
      controllerAs: 'controller'
    })
    .state('application.internal.transaction.create', {
      url: '/{itemId}/create',
      templateUrl: '/src/transaction/partial/create.html',
      controller: 'CreateTransactionController',
      controllerAs: 'controller'
    })
    .state('application.internal.account', {
      url: '/update',
      templateUrl: '/src/user/partial/update.html',
      controller: 'UpdateAccountController',
      controllerAs: 'controller'
    })
    .state('application.public', {
      abstract : true,
      template: '<ui-view></ui-view>',
      controller: 'PublicController'
    })
    .state('application.public.event', {
      url: '/e/{hash}',
      templateUrl: '/src/public/partial/event.html',
      controller: 'PublicEventController',
      controllerAs: 'controller'
    })
    .state('application.internal.myTransaction', {
      url: '/transaction/{user_id}',
      templateUrl: '/src/transaction/partial/myTransaction.html',
      controller: 'MyTransactionController',
      controllerAs: 'controller'
    })
    .state('application.public.checkoutConfirmation', {
      url: '/confirmation',
      templateUrl: '/src/checkout/partial/confirmation.html',
      controller: 'ConfirmationController',
      controllerAs: 'controller'
    });

    lockProvider.init({
      domain: settings.oauth.auth0.domain,
      clientID: settings.oauth.auth0.client_id,
      auth: {
        redirectUrl: window.location.origin + '/oauth/redirect'
      }
    });
  }
];