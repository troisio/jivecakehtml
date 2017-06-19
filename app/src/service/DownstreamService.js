export default class DownstreamService {
  constructor(
    $q,
    $rootScope,
    permissionService,
    organizationService,
    eventService,
    itemService,
    transactionService,
    storageService,
    db
  ) {
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.eventService = eventService;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.storageService = storageService;
    this.db = db;
  }

  bootstrapEventSource(source) {
    source.addEventListener('permission.delete', (sse) => {
      const permissions = JSON.parse(sse.data);
      const ids = permissions.map(permisison => permissions.id);
      const permissionTable = this.db.getSchema().table('Permission');

      this.db.delete()
        .from(permissionTable)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('permission.delete', permissions);
        });
    });

    source.addEventListener('permission.write', (sse) => {
      const permissions = JSON.parse(sse.data);
      const permissionTable = this.db.getSchema().table('Permission');
      const rows = permissions.map(permissionTable.createRow, permissionTable);

      const ands = permissions.map(permission =>
        lf.op.and(
          permissionTable.objectId.eq(permission.objectId),
          permissionTable.objectClass.eq(permission.objectClass),
          permissionTable.user_id.eq(permission.user_id)
        )
      );

      this.db.delete()
        .from(permissionTable)
        .where(lf.op.or(...ands))
        .exec()
        .then(() => {
          return this.db.insertOrReplace()
            .into(permissionTable)
            .values(rows)
            .exec()
            .then(() => {
              const storage = this.storageService.read();

              return this.organizationService.getOrganizationsByUser(storage.auth.idToken, storage.auth.idTokenPayload.sub, {}).then((organizations) => {
                const organizationTable = this.db.getSchema().table('Organization');
                const organizationRows = organizations.map(organizationTable.createRow, organizationTable);
                const organizationFuture = this.db.insertOrReplace()
                  .into(organizationTable)
                  .values(organizationRows)
                  .exec();
              });
            });
        }).then(() => {
          this.$rootScope.$broadcast('permission.write', permissions);
        });
    });

    source.addEventListener('organization.delete', (sse) => {
      const organizationsAndPermissions = JSON.parse(sse.data);
      const permissions = organizationsAndPermissions.filter(data => data.hasOwnProperty('permissions'));

      const organizations = organizationsAndPermissions.filter(data => data.hasOwnProperty('children'));
      const organizationTable = this.db.getSchema().table('Organization');
      const organizationIds = organizations.map(organization => organization.id);
      const organizationFuture = this.db.delete()
        .from(organizationTable)
        .where(organizationTable.id.in(organizationIds))
        .exec();

      const permissionTable = this.db.getSchema().table('Organization');
      const permissionIds = permissions.map(permission => permission.id);
      const permissionFuture = this.db.delete()
        .from(permissionTable)
        .where(permissionTable.id.in(permissionIds))
        .exec();

      Promise.all([organizationFuture, permissionFuture]).then((resolve) => {
        this.$rootScope.$broadcast('organization.delete', resolve);
      });
    });

    source.addEventListener('organization.update', (sse) => {
      const organizations = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Organization');
      const rows = organizations.map(table.createRow, table);
      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
            this.$rootScope.$broadcast('organization.update', organizations);
        });
    });

    source.addEventListener('organization.create', (sse) => {
      const organizationsAndPermissions = JSON.parse(sse.data);

      const permissions = organizationsAndPermissions.filter(data => data.hasOwnProperty('permissions'));
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionRows = permissions.map(permissionTable.createRow, permissionTable);
      const permissionFuture = this.db.insertOrReplace()
        .into(permissionTable)
        .values(permissionRows)
        .exec();

      const organizations = organizationsAndPermissions.filter(data => data.hasOwnProperty('children'));
      const organizationTable = this.db.getSchema().table('Organization');
      const organizationRows = organizations.map(organizationTable.createRow, organizationTable);

      const organizationFuture = this.db.insertOrReplace()
        .into(organizationTable)
        .values(organizationRows)
        .exec();

      Promise.all([organizationFuture, permissionFuture]).then((result) => {
        this.$rootScope.$broadcast('organization.create', result);
      });
    });

    source.addEventListener('event.create', (sse) => {
      const events = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Event');
      const rows = events.map(table.createRow, table);
      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('event.create', events);
        });
    });

    source.addEventListener('event.update', (sse) => {
      const events = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Event');
      const rows = events.map(table.createRow, table);
      this.db.insertOrReplace()
        .into(table)
        .values(rows)
          .exec()
          .then(() => {
            this.$rootScope.$broadcast('event.update', events);
          });
    });

    source.addEventListener('event.delete', (sse) => {
      const events = JSON.parse(sse.data);
      const ids = events.map(event => event.id);

      const table = this.db.getSchema().table('Event');
      this.db.delete()
        .from(table)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('event.delete', events);
        });
    });

    source.addEventListener('item.create', (sse) => {
      const items = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Item');
      const rows = items.map(table.createRow, table);
      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('item.create', items);
        });
    });

    source.addEventListener('item.update', (sse) => {
      const items = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Item');
      const rows = items.map(table.createRow, table);

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(res => {
          this.$rootScope.$broadcast('item.update', items);
        });
    });

    source.addEventListener('item.delete', (sse) => {
      const items = JSON.parse(sse.data);
      const ids = items.map(item => item.id);

      const table = this.db.getSchema().table('Item');
      this.db.delete()
        .from(table)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('item.delete');
        });
    });

    source.addEventListener('transaction.create', (sse) => {
      const transactions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Transaction');
      const rows = transactions.map(table.createRow, table);
      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('transaction.create', transactions);
        });
    });

    source.addEventListener('transaction.revoke', (sse) => {
      const transactions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Transaction');
      const rows = transactions.map(table.createRow, table);

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('transaction.revoke', transactions);
        });
    });

    source.addEventListener('transaction.update',(sse) => {
      const transactions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Transaction');
      const rows = transactions.map(table.createRow, table);

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('transaction.update', transactions);
        });
    });

    source.addEventListener('transaction.delete', (sse) => {
      const transactions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Transaction');
      const ids = transactions.map(transaction => transaction.id);
      const deleteFuture = this.db.delete()
        .from(table)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('transaction.delete', transactions);
        });
    });

    source.addEventListener('paymentprofile.delete', (sse) => {
      const profiles = JSON.parse(sse.data);
      const table = this.db.getSchema().table('PaypalPaymentProfile');
      const ids = profiles.map(profile => profile.id);
      const deleteFuture = this.db.delete()
        .from(table)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('paymentprofile.delete', profiles);
        });
    });

    source.addEventListener('paymentprofile.create', (sse) => {
      const profiles = JSON.parse(sse.data);
      const table = this.db.getSchema().table('PaypalPaymentProfile');
      const rows = profiles.map(table.createRow, table);

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('paymentprofile.create', profiles);
        });
    });

    source.addEventListener('asset.create', (sse) => {
      const assets = JSON.parse(sse.data);
      const table = this.db.getSchema().table('EntityAsset');
      const rows = assets.map(table.createRow, table);

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('asset.create', profiles);
        });
    });
  }

  cacheUserData(auth) {
    return this.permissionService.search(auth.idToken, {
      user_id: auth.idTokenPayload.sub
    }).then((permissionSearchResult) => {
      const permissions = permissionSearchResult.entity;
      const organizationIds = permissions
        .filter(permission => permission.objectClass === this.organizationService.getObjectClassName())
        .map(permission => permission.objectId);

      let futures;

      if (organizationIds.length > 0) {
        const permissionTable = this.db.getSchema().table('Permission');
        const permissionFuture = this.db.delete().from(permissionTable).exec().then(() => {
          const rows = permissions.map(permissionTable.createRow, permissionTable);
          return this.db.insert().into(permissionTable).values(rows).exec();
        });

        const eventFuture = this.eventService.search(auth.idToken, {
          order: '-lastActivity',
          limit: 20,
          organizationId: organizationIds
        }).then(search => {
          const events = search.entity;
          const eventIds = events.map(event => event.id);
          const eventTable = this.db.getSchema().table('Event');
          const rows = events.map(eventTable.createRow, eventTable);
          const eventFuture = this.db.insertOrReplace().into(eventTable).values(rows).exec();

          let itemFuture;

          if (eventIds.length === 0) {
            itemFuture = Promise.resolve();
          } else {
            itemFuture = this.itemService.search(auth.idToken, {
              order: '-lastActivity',
              eventId: eventIds,
              limit: 40
            }).then(search => {
              const items = search.entity;
              const itemTable = this.db.getSchema().table('Item');
              const rows = items.map(itemTable.createRow, itemTable);

              return this.db.insertOrReplace()
                .into(itemTable)
                .values(rows)
                .exec()
                .then(() => {
                  const itemIds = items.map(item => item.id);

                  let transactionFuture;

                  if (itemIds.length > 0) {
                    transactionFuture = this.transactionService.search(auth.idToken, {
                      itemId: itemIds,
                      leaf: true
                    }).then(search => {
                      const transactions = search.entity;
                      const transactionTable = this.db.getSchema().table('Transaction');
                      const rows = transactions.map(transactionTable.createRow, transactionTable);
                      const insertFuture = this.db.insertOrReplace().into(transactionTable).values(rows).exec();

                      let userFuture;
                      let assetFuture;

                      if (transactions.length > 0) {
                        const transactionIds = transactions.map(transaction => transaction.id);

                        assetFuture = this.transactionService.getUserAssets(auth.idToken, {
                          id: transactionIds
                        }).then((assets) => {
                          const assetTable = this.db.getSchema().table('EntityAsset');
                          const rows = assets.map(assetTable.createRow, assetTable);
                          return this.db.insertOrReplace().into(assetTable).values(rows).exec();
                        });

                        userFuture = this.transactionService.searchUsers(auth.idToken, {
                          id: transactionIds
                        }).then((users) => {
                          const userTable = this.db.getSchema().table('User');
                          const rows = users.map(userTable.createRow, userTable);
                          return this.db.insertOrReplace().into(userTable).values(rows).exec();
                        });
                      } else {
                        userFuture = Promise.resolve();
                        assetFuture = Promise.resolve();
                      }

                      return Promise.all([insertFuture, userFuture, assetFuture]);
                    });
                  } else {
                    transactionFuture = Promise.resolve();
                  }

                  return transactionFuture;
                });
            });
          }

          return itemFuture;
        });

        const organizationFuture = this.organizationService.getOrganizationsByUser(
          auth.idToken,
          auth.idTokenPayload.sub,
          {}
        ).then((organizations) => {
          const organiationTable = this.db.getSchema().table('Organization');
          const rows = organizations.map(organiationTable.createRow, organiationTable);
          return this.db.insertOrReplace().into(organiationTable).values(rows).exec();
        });

        futures = [eventFuture, organizationFuture, permissionFuture];
      } else {
        futures = [];
      }

      return this.$q.all(futures);
    });
  }
}

DownstreamService.$inject = [
  '$q',
  '$rootScope',
  'PermissionService',
  'OrganizationService',
  'EventService',
  'ItemService',
  'TransactionService',
  'StorageService',
  'db'
];