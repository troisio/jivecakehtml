export default class UserService {
  constructor($http, transactionService, settings, db) {
    this.$http = $http;
    this.transactionService = transactionService;
    this.settings = settings;
    this.db = db;
  }

  uploadSelfie(token, user_id, data, contentType) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'selfie'].join('/');

    return this.$http.post(url, data, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': contentType
      },
      transformRequest: []
    }).then(response => response.data);
  }

  hasGoogleIdentity(user) {
    let result = false;

    if (user.hasOwnProperty('identities')) {
      const identity = user.identities.find(identity => identity.connection === 'google-oauth2');
      result = typeof identity !== 'undefined';
    }

    return result;
  }

  hasFacebookIdentity(user) {
    let result = false;

    if (user.hasOwnProperty('identities')) {
      const identity = user.identities.find(identity => identity.connection === 'facebook');
      result = typeof identity !== 'undefined';
    }

    return result;
  }

  getUserIdsNotInDBCache(userIds) {
    const userTable = this.db.getSchema().table('User');

    return this.db.select()
      .from(userTable)
      .where(userTable.user_id.in(userIds))
      .exec()
      .then(rows => {
        const userIdsInCache = new Set();
        rows.forEach(row => userIdsInCache.add(row.user_id));

        const userIdsNotInCache = new Set();

        for (let id of userIds) {
          if (!userIdsInCache.has(id)) {
            userIdsNotInCache.add(id);
          }
        }

        return userIdsNotInCache;
      });
  }

  getUsersNotInDBCacheFromTransactionQuery(token, loveFieldQuery) {
    const transactionTable = this.db.getSchema().table('Transaction');

    return this.db.select()
      .from(transactionTable)
      .where(loveFieldQuery)
      .exec()
      .then(rows => {
        const transactions = this.transactionService.getMinimalUserIdCovering(rows);
        const userIds = transactions.map(row => row.user_id);

        return this.getUserIdsNotInDBCache(userIds).then(ids => {
          const userIds = new Set();
          ids.forEach(id => userIds.add(id));

          const transactionIds = transactions.filter(transaction => userIds.has(transaction.user_id))
            .map(transaction => transaction.id);

          return this.transactionService.searchUsers(token, {
            id: transactionIds
          });
        });
      });
  }

  refreshUserCacheFromTransactions(token, loveFieldQuery) {
    return this.getUsersNotInDBCacheFromTransactionQuery(token, loveFieldQuery).then(users => {
      const userTable = this.db.getSchema().table('User');
      const rows = users.map(userTable.createRow, userTable);
      return this.db.insertOrReplace().into(userTable).values(rows).exec();
    });
  }
}

UserService.$inject = ['$http', 'TransactionService', 'settings', 'db'];