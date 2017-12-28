export default class DownstreamService {
  constructor(
    $rootScope,
    permissionService,
    organizationService,
    organizationInvitationService,
    transactionService,
    storageService,
    assetService,
    db,
    SearchEntity
  ) {
    this.$rootScope = $rootScope;
    this.permissionService = permissionService;
    this.organizationService = organizationService;
    this.organizationInvitationService = organizationInvitationService;
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

    source.addEventListener('permission.create', (sse) => {
      const permissions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Permission');
      const rows = permissions.map(permission => table.createRow(permission));

      this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec();
    });

    source.addEventListener('organization.delete', (sse) => {
      const organizationsAndPermissions = JSON.parse(sse.data);
      const permissions = organizationsAndPermissions.filter(data => data.hasOwnProperty('permissions'));

      const organizations = organizationsAndPermissions.filter(data => data.hasOwnProperty('email'));
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
      const permissionRows = permissions.map(permission => permissionTable.createRow(permission));
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
      const table = this.db.getSchema().table('PaymentProfile');
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
      const table = this.db.getSchema().table('PaymentProfile');
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

    source.addEventListener('organizationInvitation.create', (sse) => {
      const entities = JSON.parse(sse.data);
      const table = this.db.getSchema().table('OrganizationInvitation');
      const rows = entities.map(table.createRow, table);

      return this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('organizationInvitation.create', entities);
        });
    });

    source.addEventListener('organizationInvitation.delete', (sse) => {
      const entities = JSON.parse(sse.data);
      const table = this.db.getSchema().table('OrganizationInvitation');
      const ids = entities.map(entity => entity.id);

      this.db.delete()
        .from(table)
        .where(table.id.in(ids))
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('organizationInvitation.delete', entities);
        });
    });

    source.addEventListener('organizationInvitation.update', (sse) => {
      const entities = JSON.parse(sse.data);
      const table = this.db.getSchema().table('OrganizationInvitation');
      const rows = entities.map(table.createRow, table);

      return this.db.insertOrReplace()
        .into(table)
        .values(rows)
        .exec()
        .then(() => {
          this.$rootScope.$broadcast('organizationInvitation.update', entities);
        });
    });
  }

  writeOrganizationTreeToLocalDatabase(token, organizationIds) {
    const treeFutures = organizationIds.map((organizationId) => {
      return this.organizationService.getTree(token, organizationId).then((tree) => {
        const organizationTable = this.db.getSchema().table('Organization');
        const paymentProfileTable = this.db.getSchema().table('PaymentProfile');
        const eventTable = this.db.getSchema().table('Event');
        const itemTable = this.db.getSchema().table('Item');
        const transactionTable = this.db.getSchema().table('Transaction');

        const events = tree.event.map(eventTable.createRow, eventTable);
        const paymentProfiles = tree.event.map(paymentProfileTable.createRow, paymentProfileTable);
        const items = tree.item.map(itemTable.createRow, itemTable);
        const transactions = tree.transaction.map(transactionTable.createRow, transactionTable);

        const organizationInsertFuture = this.db.insertOrReplace()
          .into(organizationTable)
          .values([organizationTable.createRow(tree.organization)])
          .exec()
          .then(() => {
            return this.db.insertOrReplace().into(paymentProfileTable).values(paymentProfiles).exec();
          });
        const treeInsertFuture = this.db.insertOrReplace().into(eventTable).values(events).exec()
          .then(() => {
            return this.db.insertOrReplace().into(itemTable).values(items).exec()
              .then(() => {
                return this.db.insertOrReplace().into(transactionTable).values(transactions).exec()
              });
          });

        let userFuture;
        let assetFuture;

        const transactionIdsUserSearch = this.transactionService.getMinimalUserIdCovering(tree.transaction)
          .map(transaction => transaction.id);

        if (transactionIdsUserSearch.length > 0) {
          assetFuture = this.transactionService.getUserAssets(token, {
            id: transactionIdsUserSearch
          }).then((assets) => {
            const assetTable = this.db.getSchema().table('EntityAsset');
            const rows = assets.map(asset => assetTable.createRow(asset));
            return this.db.insertOrReplace().into(assetTable).values(rows).exec();
          });

          userFuture = this.transactionService.searchUsers(token, {
            id: transactionIdsUserSearch
          }).then((users) => {
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
        } else {
          userFuture = Promise.resolve();
          assetFuture = Promise.resolve();
        }

        return Promise.all([organizationInsertFuture, treeInsertFuture, userFuture, assetFuture]);
      });
    });

    return Promise.all(treeFutures);
  }

  cacheUserTransactions(auth) {
    return this.transactionService.search(
      auth.idToken,
      {
        userId: auth.idTokenPayload.sub,
        limit: 100
      }
    ).then((search) => {
      const transctions = search.entity;
      const minimumCoveringOrganizationIds = new Set();
      const transactionsForOrganization = [];
      const minimumCoveringItemIds = new Set();
      const transactionsForItems = [];
      const minimumCoveringEventIds = new Set();
      const transactionsForEvents = [];

      for (let transaction of transctions) {
        if (!minimumCoveringOrganizationIds.has(transaction.organizationId)) {
          transactionsForOrganization.push(transaction);
          minimumCoveringOrganizationIds.add(transaction.organizationId);
        }

        if (!minimumCoveringItemIds.has(transaction.itemId)) {
          transactionsForItems.push(transaction);
          minimumCoveringItemIds.add(transaction.itemId);
        }

        if (!minimumCoveringEventIds.has(transaction.eventId)) {
          transactionsForEvents.push(transaction);
          minimumCoveringEventIds.add(transaction.eventId);
        }
      }

      const organizationPromises = transactionsForOrganization.map(transaction => {
        return this.transactionService.getOrganization(auth.idToken, transaction.id);
      });
      const eventPromises = transactionsForEvents.map(transaction => {
        return this.transactionService.getEvent(auth.idToken, transaction.id);
      });
      const itemPromises = transactionsForItems.map(transaction => {
        return this.transactionService.getItem(auth.idToken, transaction.id);
      });

      const organizationPromise = Promise.all(organizationPromises).then((entities) => {
        const table = this.db.getSchema().table('Organization');
        const rows = entities.map(entity => table.createRow(entity));

        return this.db.insertOrReplace()
          .into(table)
          .values(rows)
          .exec();
      });

      const eventPromise = Promise.all(
        [
          Promise.all(eventPromises),
          organizationPromise
        ]
      ).then((resolve) => {
        const entities = resolve[0];
        const table = this.db.getSchema().table('Event');
        const rows = entities.map(entity => table.createRow(entity));

        return this.db.insertOrReplace()
          .into(table)
          .values(rows)
          .exec();
      });

      const itemPromise = Promise.all(
        [
          Promise.all(itemPromises),
          eventPromise
        ]
      ).then((resolve) => {
        const entities = resolve[0];
        const table = this.db.getSchema().table('Item');
        const rows = entities.map(entity => table.createRow(entity));

        return this.db.insertOrReplace()
          .into(table)
          .values(rows)
          .exec();
      });

      const transactionPromise = itemPromise.then(() => {
        const table = this.db.getSchema().table('Transaction');
        const rows = transctions.map(entity => table.createRow(entity));

        return this.db.insertOrReplace()
          .into(table)
          .values(rows)
          .exec();
      });

      return transactionPromise;
    });
  }

  cacheUserData(auth) {
    const transactionFuture = this.cacheUserTransactions(auth);
    const permissionFuture = this.permissionService.search(auth.idToken, {
      user_id: auth.idTokenPayload.sub
    }).then(permissionSearchResult => {
      const permissions = permissionSearchResult.entity;
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionRows = permissions.map(permissions => permissionTable.createRow(permissions));
      const permissionFuture = this.db.insert().into(permissionTable).values(permissionRows).exec();

      const invitationFuture = this.organizationInvitationService.getUserInvitations(
        auth.idToken,
        auth.idTokenPayload.sub
      ).then((invitations) => {
        const table = this.db.getSchema().table('OrganizationInvitation');
        const rows = invitations.map(invitation => table.createRow(invitation));
        return this.db.insert().into(table).values(rows).exec();
      });

      const organizationIds = permissions
        .filter(permission => permission.objectClass === 'Organization')
        .map(permission => permission.objectId);

      const treeFuture = this.writeOrganizationTreeToLocalDatabase(auth.idToken, organizationIds);
      return Promise.all([
        invitationFuture,
        permissionFuture,
        treeFuture,
        transactionFuture
      ]);
    });

    return Promise.all([
      transactionFuture,
      permissionFuture
    ]);
  }
}

DownstreamService.$inject = [
  '$rootScope',
  'PermissionService',
  'OrganizationService',
  'OrganizationInvitationService',
  'TransactionService',
  'StorageService',
  'AssetService',
  'db',
  'SearchEntity'
];