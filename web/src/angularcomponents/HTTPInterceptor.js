export default class HTTPInterceptor {
  constructor($q, $rootScope, settings) {
    this.responseError = function(request) {
      const isJiveCakeAPIRequest = request.config.url.startsWith(settings.jivecakeapi.uri);
      const isInValidGrant = request.data !== null && request.data.error === 'invalid_grant' && request.status === 400;

      if (isJiveCakeAPIRequest && isInValidGrant) {
        $rootScope.$broadcast('jivecakeapi.oauth.invalid_grant', request.data);
      }

      return $q.reject(request);
    };
  }
}

HTTPInterceptor.$inject = ['$q', '$rootScope', 'settings'];