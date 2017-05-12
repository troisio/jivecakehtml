const builder = lf.schema.create('jivecake', 1);

builder.createTable('Permission')
  .addColumn('id', lf.Type.STRING)
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('objectId', lf.Type.STRING)
  .addColumn('include', lf.Type.INTEGER)
  .addColumn('objectClass', lf.Type.STRING)
  .addColumn('permissions', lf.Type.ARRAY_BUFFER)
  .addColumn('timeCreated', lf.Type.DATETIME)
  .addUnique('unique', ['objectClass', 'objectId', 'user_id'])
  .addPrimaryKey(['id']);

builder.createTable('Organization')
  .addColumn('id', lf.Type.STRING)
  .addColumn('parentId', lf.Type.STRING)
  .addColumn('children', lf.Type.ARRAY_BUFFER)
  .addColumn('name', lf.Type.STRING)
  .addColumn('email', lf.Type.STRING)
  .addColumn('timeUpdated', lf.Type.DATETIME)
  .addColumn('timeCreated', lf.Type.DATETIME)
  .addColumn('lastActivity', lf.Type.DATETIME)
  .addNullable(['parentId', 'timeUpdated', 'lastActivity'])
  .addPrimaryKey(['id']);

builder.createTable('Event')
  .addColumn('id', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('minimumTimeBetweenTransactionTransfer', lf.Type.INTEGER)
  .addColumn('description', lf.Type.STRING)
  .addColumn('status', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('paymentProfileId', lf.Type.STRING)
  .addColumn('currency', lf.Type.STRING)
  .addColumn('timeStart', lf.Type.DATETIME)
  .addColumn('timeEnd', lf.Type.DATETIME)
  .addColumn('timeCreated', lf.Type.DATETIME)
  .addColumn('timeUpdated', lf.Type.DATETIME)
  .addColumn('lastActivity', lf.Type.DATETIME)
  .addNullable([
    'paymentProfileId',
    'description',
    'currency',
    'timeUpdated',
    'timeStart',
    'timeEnd'
  ])
  .addPrimaryKey(['id']);

builder.createTable('Item')
  .addColumn('id', lf.Type.STRING)
  .addColumn('eventId', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('description', lf.Type.STRING)
  .addColumn('totalAvailible', lf.Type.INTEGER)
  .addColumn('maximumPerUser', lf.Type.INTEGER)
  .addColumn('amount', lf.Type.INTEGER)
  .addColumn('timeAmounts', lf.Type.ARRAY_BUFFER)
  .addColumn('countAmounts', lf.Type.ARRAY_BUFFER)
  .addColumn('status', lf.Type.INTEGER)
  .addColumn('timeStart', lf.Type.DATETIME)
  .addColumn('timeEnd', lf.Type.DATETIME)
  .addColumn('timeUpdated', lf.Type.DATETIME)
  .addColumn('timeCreated', lf.Type.DATETIME)
  .addColumn('lastActivity', lf.Type.DATETIME)
  .addNullable([
    'timeUpdated',
    'timeStart',
    'timeEnd',
    'countAmounts',
    'timeAmounts',
    'maximumPerUser',
    'totalAvailible',
    'description',
    'name'
  ])
  .addPrimaryKey(['id']);

builder.createTable('Transaction')
  .addColumn('id', lf.Type.STRING)
  .addColumn('parentTransactionId', lf.Type.STRING)
  .addColumn('itemId', lf.Type.STRING)
  .addColumn('eventId', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('linkedId', lf.Type.STRING)
  .addColumn('linkedObjectClass', lf.Type.STRING)
  .addColumn('status', lf.Type.INTEGER)
  .addColumn('paymentStatus', lf.Type.INTEGER)
  .addColumn('quantity', lf.Type.INTEGER)
  .addColumn('given_name', lf.Type.STRING)
  .addColumn('middleName', lf.Type.STRING)
  .addColumn('family_name', lf.Type.STRING)
  .addColumn('amount', lf.Type.NUMBER)
  .addColumn('currency', lf.Type.STRING)
  .addColumn('email', lf.Type.STRING)
  .addColumn('leaf', lf.Type.BOOLEAN)
  .addColumn('lastTransferTime', lf.Type.DATETIME)
  .addColumn('timeCreated', lf.Type.DATETIME)
  .addNullable([
    'parentTransactionId',
    'user_id',
    'linkedId',
    'linkedObjectClass',
    'given_name',
    'middleName',
    'family_name',
    'email',
    'lastTransferTime'
  ])
  .addPrimaryKey(['id']);

export default builder;