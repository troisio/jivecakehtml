export default class DownstreamService {
  constructor(
    $rootScope,
    permissionService,
    organizationService,
    eventService,
    itemService,
    transactionService,
    storageService,
    db
  ) {
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
          this.db.insertOrReplace()
            .into(permissionTable)
            .values(rows)
            .exec()
            .then(() => {
              const storage = this.storageService.read();

              this.organizationService.getOrganizationsByUser(storage.auth.idToken, storage.auth.idTokenPayload.sub, {}).then((organizations) => {
                const organizationTable = this.db.getSchema().table('Organization');
                const organizationRows = organizations.map(organizationTable.createRow, organizationTable);
                const organizationFuture = this.db.insertOrReplace()
                  .into(organizationTable)
                  .values(organizationRows)
                  .exec();
              });
            });
        });
    });

    source.addEventListener('organization.delete', (sse) => {
      const organizationsAndPermissions = JSON.parse(sse.data);
      const permissions = organizationsAndPermissions.filter(data => 'permissions' in data);

      const organizations = organizationsAndPermissions.filter(data => 'children' in data);
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
      this.db.insertOrReplace().into(table).values(rows).exec();
    });

    source.addEventListener('organization.create', (sse) => {
      const organizationsAndPermissions = JSON.parse(sse.data);

      const permissions = organizationsAndPermissions.filter(data => 'permissions' in data);
      const permissionTable = this.db.getSchema().table('Permission');
      const permissionRows = permissions.map(permissionTable.createRow, permissionTable);
      const permissionFuture = this.db.insertOrReplace()
        .into(permissionTable)
        .values(permissionRows)
        .exec();

      const organizations = organizationsAndPermissions.filter(data => 'children' in data);
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
      this.db.insertOrReplace().into(table).values(rows).exec();
    });

    source.addEventListener('transaction.revoke', (sse) => {
      const transactions = JSON.parse(sse.data);
      const table = this.db.getSchema().table('Transaction');
      const rows = transactions.map(table.createRow, table);
      this.db.insertOrReplace().into(table).values(rows).exec();
    });

    source.addEventListener('transaction.delete', (sse) => {
      const transactions = JSON.parse(sse.data);
      const deletedTransaction = transactions[0];
      const table = this.db.getSchema().table('Transaction');

      this.db.delete()
        .from(table)
        .where(table.id.eq(deletedTransaction.id))
        .exec();

      if (transactions.length > 0) {
        const updatedParent = transactions[1];

        this.db.insertOrReplace()
          .into(table)
          .values([table.createRow(updatedParent)])
          .exec();
      }
    });
  }
}

DownstreamService.$inject = [
  '$rootScope',
  'PermissionService',
  'OrganizationService',
  'EventService',
  'ItemService',
  'TransactionService',
  'StorageService',
  'db'
];