export default [
  '$locationProvider',
  '$stateProvider',
  '$urlRouterProvider',
  '$mdThemingProvider',
  '$mdDateLocaleProvider',
  '$httpProvider',
  'settings',
  'authProvider',
   function(
     $locationProvider,
     $stateProvider,
     $urlRouterProvider,
     $mdThemingProvider,
     $mdDateLocaleProvider,
     $httpProvider,
     settings,
     authProvider
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
    .state('application.public.terms', {
      url: '/terms',
      templateUrl: '/src/application/partial/terms.html'
    })
    .state('application.internal', {
      controller: 'InternalApplicationController',
      templateUrl: '/src/application/partial/internal.html'
    })
    .state('application.public.oauthRedirect', {
      url: '/oauth/redirect',
      controller: 'OAuthRedirectController'
    })
    .state('application.internal.event', {
      abstract: true,
      url : '/event?status&name',
      template: '<div ui-view></div>',
      controller: 'EventController'
    })
    .state('application.internal.event.read', {
      url : '?organizationId&eventId&page&pageSize&order&id',
      templateUrl: '/src/event/partial/read.html',
      controller: 'ReadEventController',
      controllerAs: 'controller',
      params: {
        page: '0',
        pageSize: '10',
        order: '-timeUpdated'
      }
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
      url: '?organizationId&eventId&id&page&pageSize&order',
      templateUrl: '/src/item/partial/read.html',
      controller: 'ReadItemController',
      controllerAs: 'controller',
      params: {
        page: '0',
        pageSize: '10',
        order: '-timeUpdated'
      }
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
      url: '/organization?page&pageSize&id&order',
      templateUrl: '/src/organization/partial/read.html',
      controller: 'ReadOrganizationController',
      controllerAs: 'controller',
      params: {
        page: '0',
        pageSize: '10',
        order: '-name'
      }
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
      controller: 'ItemTransactionController',
      template: '<ui-view flex layout="column"></ui-view>'
    })
    .state('application.internal.transaction.read', {
      url: '?organizationId&eventId&itemId',
      templateUrl: '/src/transaction/partial/read.html',
      controller: 'ReadTransactionController',
      controllerAs: 'controller'
    })
    .state('application.internal.transaction.create', {
      url: '/{itemId}/create',
      templateUrl: '/src/transaction/partial/create.html',
      controller: 'CreateItemTransactionController',
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
      templateUrl: '/src/public/partial/index.html',
      controller: 'PublicController'
    })
    .state('application.public.event', {
      url: '/event/{id}',
      templateUrl: '/src/public/partial/event.html',
      controller: 'PublicEventController',
      controllerAs: 'controller'
    })
    .state('application.public.event.item', {
      url: '/item',
      templateUrl: '/src/public/partial/item.html',
      controller: 'PublicEventItemController',
      controllerAs: 'controller'
    })
    .state('application.internal.myTransaction', {
      url: '/transaction/{user_id}?order&page&pageSize',
      templateUrl: '/src/transaction/partial/myTransaction.html',
      controller: 'MyTransactionController',
      controllerAs: 'controller',
      params: {
        page: '0',
        pageSize: '10',
        order: '-timeCreated'
      }
    })
    .state('application.public.cart', {
      url: '/cart',
      templateUrl: '/src/checkout/partial/cart.html',
      controller: 'CartController',
      controllerAs: 'controller'
    })
    .state('application.public.checkoutConfirmation', {
      url: '/confirmation',
      templateUrl: '/src/checkout/partial/confirmation.html',
      controller: 'ConfirmationController',
      controllerAs: 'controller'
    })
    .state('application.public.checkout', {
      url: '/checkout/{entityId}',
      templateUrl: '/src/checkout/partial/checkout.html',
      controller: 'CheckoutController'
    });

    authProvider.init({
      domain: settings.oauth.auth0.domain,
      clientID: settings.oauth.auth0.client_id
    });

    authProvider.on('loginSuccess', [
      'angular',
      '$window',
      '$location',
      '$state',
      '$mdDialog',
      'profilePromise',
      'idToken',
      'state',
      'OrganizationService',
      'PermissionService',
      'UIService',
      'StorageService',
      'JiveCakeLocalStorage',
      function(
        angular,
        $window,
        $location,
        $state,
        $mdDialog,
        profilePromise,
        idToken,
        state,
        organizationService,
        permissionService,
        uiService,
        storageService,
        JiveCakeLocalStorage
      ) {
        profilePromise.then(function(profile) {
          const storage = new JiveCakeLocalStorage();
          storage.timeCreated = new window.Date().getTime();
          storage.token = idToken;
          storage.profile = profile;

          storageService.write(storage);

          return permissionService.search(idToken, {
            user_id: profile.user_id,
            objectClass: organizationService.getObjectClassName()
          }).then(function(search) {
            const routerParameters = angular.fromJson(state);

            if (routerParameters.name === 'application.public.home') {
              if (search.entity.length > 0) {
                $state.go('application.internal.organization.read', {}, {reload: true});
              } else {
                $state.go('application.internal.myTransaction', {
                  user_id: profile.user_id
                }, {
                  reload: true
                });
              }
            } else {
              $state.go(routerParameters.name, routerParameters.stateParams, {reload: true});
            }
          });
        }, function() {
          uiService.notify('Unable to login');
        });
      }
    ]);

    authProvider.on('loginFailure', function() {
    });
  }
];