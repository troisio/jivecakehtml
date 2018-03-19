export default class ImpersonationController {
  constructor($state, userService, storageService, auth0Service) {
    const storage = storageService.read();

    userService.writeUserToken($state.params.userId, storage.auth.accessToken).then(token => {
      const storage = storageService.read();
      storage.auth.accessToken = token;

      auth0Service.getUser(token, $state.params.userId).then((profile) => {
        const exp = new Date();
        exp.setHours(exp.getHours() + 1);

        storage.profile = profile;
        storage.auth.idTokenPayload = {
          sub: profile.user_id,
          exp: exp.getTime()
        };

        storageService.write(storage);
      });
    });
  }
}

ImpersonationController.$inject = ['$state', 'UserService', 'StorageService', 'Auth0Service'];