export default class UserService {
  constructor($http, transactionService, settings, db) {
    this.$http = $http;
    this.transactionService = transactionService;
    this.settings = settings;
    this.db = db;
  }

  hasFirstAndLastName(profile) {
    let result;

    if (profile.hasOwnProperty('given_name') && profile.hasOwnProperty('family_name')) {
      result = true;
    } else if (profile.hasOwnProperty('user_metadata')) {
      result = profile.user_metadata.hasOwnProperty('given_name') &&
        profile.user_metadata.hasOwnProperty('family_name');
    } else {
      result = false;
    }

    return result;
  }

  uploadSelfie(token, user_id, body, contentType) {
    const url = [this.settings.jivecakeapi.uri, 'user', user_id, 'selfie'].join('/');

    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType
      },
      method: 'POST',
      body: body
    });
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

  getUserIdsNotInDB(userIds) {
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

        return this.getUserIdsNotInDB(userIds).then(ids => {
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

  refreshUserCacheFromTransactions(token, query) {
    return this.getUsersNotInDBCacheFromTransactionQuery(token, query).then(users => {
      const userTable = this.db.getSchema().table('User');
      const rows = users.map((user) => {
        if (user.user_metadata && user.user_metadata.given_name) {
          user.user_metadata_given_name = user.user_metadata.given_name;
        }

        if (user.user_metadata && user.user_metadata.family_name) {
          user.user_metadata_family_name = user.user_metadata.family_name;
        }

        return userTable.createRow(user);
      });
      return this.db.insertOrReplace().into(userTable).values(rows).exec();
    });
  }
}

UserService.$inject = ['$http', 'TransactionService', 'settings', 'db'];