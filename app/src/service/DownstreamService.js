import lf from 'lovefield';

export default class DownstreamService {
  constructor(
    $rootScope,
    permissionService,
    organizationService,
    transactionService,
    storageService,
    assetService,
    db,
    SearchEntity
  ) {
    this.$rootScope = $rootScope;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.transactionService = transactionService;
    this.storageService = storageService;
    this.assetService = assetService;
    this.db = db;
    this.SearchEntity = SearchEntity;
  }

  bootstrapEventSource(source) {
    source.addEventListener('permission.delete', (sse) => {
      const permissions = JSON.parse(sse.data);
      const ids = permissions.map(permission => permission.id);
      const permissionTable = this.db.getSchema().table('Permission');

      this.db.delete()
        .from(permissionTable)
        .where(permissionTable.id.in(ids))
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

                return this.db.insertOrReplace()
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

      const permissions = organizationsAndPermissions.filter(data => data.hasOwnProperty('objectClass'));
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionRows = permissions.map(permissionTable.createRow, permissionTable);
      const permissionFuture = this.db.insertOrReplace()
        .into(permissionTable)
        .values(permissionRows)
        .exec();

      const organizations = organizationsAndPermissions.filter(data => data.hasOwnProperty('email'));
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
        .then(() => {
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

      this.db.delete()
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

      this.db.delete()
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

      const futures = assets.map(asset => {
        let future;

        if (asset.assetType === this.assetService.GOOGLE_CLOUD_STORAGE_BLOB_FACE) {
          future = this.db.delete().from(table)
            .where(
              table.assetType.eq(this.assetService.GOOGLE_CLOUD_STORAGE_BLOB_FACE),
              table.entityType.eq(this.assetService.USER_TYPE),
              table.entityId.eq(asset.entityId)
            )
            .exec();
        } else {
          future = Promise.resolve();
        }

        return future;
      });

      Promise.all(futures).then(() => {
        const rows = assets.map(table.createRow, table);

        return this.db.insertOrReplace()
          .into(table)
          .values(rows)
          .exec()
          .then(() => {
            this.$rootScope.$broadcast('asset.create', assets);
          });
      });
    });
  }

  cacheUserData(auth) {
    return this.permissionService.search(auth.idToken, {
      user_id: auth.idTokenPayload.sub
    }).then(permissionSearchResult => {
      const permissions = permissionSearchResult.entity;
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionRows = permissions.map(permissionTable.createRow, permissionTable);
      const permissionFuture = this.db.insert().into(permissionTable).values(permissionRows).exec();

      const organizationIds = permissions
        .filter(permission => permission.objectClass === 'Organization')
        .map(permission => permission.objectId);

      const treeFutures = organizationIds.map((organizationId) => {
        return this.organizationService.getTree(auth.idToken, organizationId).then((tree) => {
          const organizationTable = this.db.getSchema().table('Organization');
          const paymentProfileTable = this.db.getSchema().table('PaymentProfile');
          const eventTable = this.db.getSchema().table('Event');
          const itemTable = this.db.getSchema().table('Item');
          const transactionTable = this.db.getSchema().table('Transaction');

          const events = tree.event.map(eventTable.createRow, eventTable);
          const paymentProfiles = tree.event.map(paymentProfileTable.createRow, paymentProfileTable);
          const items = tree.item.map(itemTable.createRow, itemTable);
          const transactions = tree.transaction.map(transactionTable.createRow, transactionTable);

          const organizationInsertFuture = this.db.insert()
            .into(organizationTable)
            .values([organizationTable.createRow(tree.organization)])
            .exec()
            .then(() => {
              return this.db.insert().into(paymentProfileTable).values(paymentProfiles).exec();
            });
          const treeInsertFuture = this.db.insert().into(eventTable).values(events).exec()
            .then(() => {
              return this.db.insert().into(itemTable).values(items).exec()
                .then(() => {
                  return this.db.insert().into(transactionTable).values(transactions).exec()
                });
            });

          let userFuture;
          let assetFuture;

          const transactionIdsUserSearch = this.transactionService.getMinimalUserIdCovering(tree.transaction)
            .map(transaction => transaction.id);

          if (transactionIdsUserSearch.length > 0) {
            assetFuture = this.transactionService.getUserAssets(auth.idToken, {
              id: transactionIdsUserSearch
            }).then((assets) => {
              const assetTable = this.db.getSchema().table('EntityAsset');
              const rows = assets.map(assetTable.createRow, assetTable);
              return this.db.insertOrReplace().into(assetTable).values(rows).exec();
            });

            userFuture = this.transactionService.searchUsers(auth.idToken, {
              id: transactionIdsUserSearch
            }).then((users) => {
              const userTable = this.db.getSchema().table('User');
              const rows = users.map(userTable.createRow, userTable);
              return this.db.insertOrReplace().into(userTable).values(rows).exec();
            });
          } else {
            userFuture = Promise.resolve();
            assetFuture = Promise.resolve();
          }

          return Promise.all([organizationInsertFuture, treeInsertFuture, userFuture, assetFuture]);
        });
      });

      return Promise.all(treeFutures.concat([permissionFuture]));
    });
  }
}

DownstreamService.$inject = [
  '$rootScope',
  'PermissionService',
  'OrganizationService',
  'TransactionService',
  'StorageService',
  'AssetService',
  'db',
  'SearchEntity'
];